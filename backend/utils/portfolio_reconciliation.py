"""
portfolio_reconciliation.py — Safe Portfolio Consistency & Reconciliation Diagnostic

Provides read-only portfolio reconciliation across UserWallet, Holdings, and Transactions.
Detects data integrity discrepancies without mutating database records or fabricating history.
"""

import json
import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from models.user import User
from models.portfolio import Holding
from models.transaction import Transaction
from models.wallet import UserWallet
from routes.wallet import AVAILABLE_TASKS

logger = logging.getLogger(__name__)


def reconcile_user_portfolio(user_id: int, db: Session) -> dict:
    """
    Performs a deterministic, read-only consistency audit for a user's portfolio.

    Detects:
    1. HOLDING_WITHOUT_TRANSACTION: Active holding exists but 0 BUY transactions recorded.
    2. TRANSACTION_HOLDING_QUANTITY_MISMATCH: Holding quantity != (BUY qty - SELL qty).
    3. TRANSACTION_WITHOUT_HOLDING: Open transaction quantity > 0 but holding record is missing.
    4. WALLET_TRADE_CASH_MISMATCH: Wallet cash != (claimed rewards - buy costs + sell proceeds).
    5. DUPLICATE_HOLDING: Multiple holding rows for the same symbol.

    Never modifies any database record. Never invents transactions or dates.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {
            "user_id": user_id,
            "is_consistent": False,
            "status": "error",
            "message": f"User {user_id} not found in database.",
            "issues": [],
            "summary": {}
        }

    issues: List[dict] = []

    # ── 1. Query records ──────────────────────────────────────────────────────
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.timestamp.asc())
        .all()
    )
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).first()

    # ── 2. Wallet & Cash Reconciliation ───────────────────────────────────────
    claimed_ids: List[str] = []
    if wallet and wallet.claimed_tasks:
        try:
            claimed_ids = json.loads(wallet.claimed_tasks)
        except Exception:
            claimed_ids = []

    claimed_cash = round(
        sum(t["reward_cash"] for t in AVAILABLE_TASKS if t["id"] in claimed_ids),
        2
    )

    total_buy_amount = round(
        sum(t.total_amount for t in txns if t.trade_type == "BUY"),
        2
    )
    total_sell_amount = round(
        sum(t.total_amount for t in txns if t.trade_type == "SELL"),
        2
    )
    expected_cash = round(claimed_cash - total_buy_amount + total_sell_amount, 2)
    actual_cash = round(wallet.virtual_cash, 2) if wallet else 0.0

    if abs(actual_cash - expected_cash) > 0.01:
        issues.append({
            "type": "WALLET_TRADE_CASH_MISMATCH",
            "symbol": None,
            "actual_cash": actual_cash,
            "expected_cash": expected_cash,
            "difference": round(actual_cash - expected_cash, 2),
            "message": (
                f"Wallet cash balance (Rs. {actual_cash:,.2f}) differs from "
                f"expected cash based on claimed rewards and transactions (Rs. {expected_cash:,.2f})."
            )
        })

    # ── 3. Transaction Aggregation by Symbol ──────────────────────────────────
    txn_summary: Dict[str, dict] = {}
    for t in txns:
        entry = txn_summary.setdefault(t.symbol, {
            "buy_qty": 0,
            "sell_qty": 0,
            "buy_cost": 0.0,
            "sell_proceeds": 0.0,
            "txn_count": 0
        })
        entry["txn_count"] += 1
        if t.trade_type == "BUY":
            entry["buy_qty"] += t.quantity
            entry["buy_cost"] = round(entry["buy_cost"] + t.total_amount, 2)
        elif t.trade_type == "SELL":
            entry["sell_qty"] += t.quantity
            entry["sell_proceeds"] = round(entry["sell_proceeds"] + t.total_amount, 2)

    # ── 4. Holdings Aggregation & Duplicate Check ─────────────────────────────
    holdings_by_symbol: Dict[str, List[Holding]] = {}
    for h in holdings:
        holdings_by_symbol.setdefault(h.symbol, []).append(h)

    # Check for duplicate holding rows
    for sym, h_list in holdings_by_symbol.items():
        if len(h_list) > 1:
            issues.append({
                "type": "DUPLICATE_HOLDING",
                "symbol": sym,
                "count": len(h_list),
                "holding_ids": [h.id for h in h_list],
                "message": f"Multiple holding records ({len(h_list)}) exist for symbol {sym}."
            })

    # ── 5. Holding vs Transaction Cross-Check ─────────────────────────────────
    for sym, h_list in holdings_by_symbol.items():
        total_holding_qty = sum(h.quantity for h in h_list)
        txn_data = txn_summary.get(sym)

        if not txn_data or txn_data["buy_qty"] == 0:
            # Holding exists with 0 buy transactions
            issues.append({
                "type": "HOLDING_WITHOUT_TRANSACTION",
                "symbol": sym,
                "holding_quantity": total_holding_qty,
                "message": f"Active holding for {sym} (Qty: {total_holding_qty}) exists without corresponding BUY transactions."
            })
        else:
            expected_open_qty = txn_data["buy_qty"] - txn_data["sell_qty"]
            if total_holding_qty != expected_open_qty:
                issues.append({
                    "type": "TRANSACTION_HOLDING_QUANTITY_MISMATCH",
                    "symbol": sym,
                    "holding_quantity": total_holding_qty,
                    "expected_quantity": expected_open_qty,
                    "message": (
                        f"Holding quantity for {sym} ({total_holding_qty}) does not match "
                        f"expected open quantity from transactions ({expected_open_qty})."
                    )
                })

    # ── 6. Transaction Open Positions Without Holding ─────────────────────────
    for sym, txn_data in txn_summary.items():
        expected_open_qty = txn_data["buy_qty"] - txn_data["sell_qty"]
        if expected_open_qty > 0 and sym not in holdings_by_symbol:
            issues.append({
                "type": "TRANSACTION_WITHOUT_HOLDING",
                "symbol": sym,
                "expected_quantity": expected_open_qty,
                "message": (
                    f"Transactions indicate {expected_open_qty} open shares of {sym}, "
                    f"but no active holding record exists in the database."
                )
            })

    is_consistent = len(issues) == 0

    return {
        "user_id": user_id,
        "user_name": user.name,
        "is_consistent": is_consistent,
        "status": "consistent" if is_consistent else "warning",
        "issues": issues,
        "summary": {
            "wallet_cash_actual": actual_cash,
            "wallet_cash_expected": expected_cash,
            "claimed_rewards_capital": claimed_cash,
            "claimed_tasks": claimed_ids,
            "total_buy_amount": total_buy_amount,
            "total_sell_amount": total_sell_amount,
            "holdings_count": len(holdings),
            "transactions_count": len(txns)
        }
    }
