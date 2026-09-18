from datetime import date
from typing import Optional

CURRICULUM = [
    (1, "Market Basics", [
        ("Stock", "A stock represents a small ownership interest in a company.", "Owning shares of an Indian company means owning a small part of that company."),
        ("NSE", "The National Stock Exchange is a major marketplace where Indian shares are traded.", "Reliance and TCS shares can be bought or sold through the NSE during market hours."),
        ("BSE", "The Bombay Stock Exchange is one of India's established stock exchanges.", "A company can have its shares listed on both the BSE and NSE."),
        ("Market Price", "Market price is the latest price buyers and sellers are agreeing on for a share.", "If Infosys is trading at a particular price, that is its market price at that moment."),
        ("Portfolio", "A portfolio is the collection of investments owned by an investor.", "A portfolio containing Reliance and TCS shares has two different investments."),
        ("Market Capitalization", "Market capitalization is the total market value of all a company's shares.", "A large Indian company with many valuable shares may be called a large-cap company."),
        ("Volume", "Volume is the number of shares traded during a period.", "A rise in TCS trading volume means more TCS shares changed hands that day."),
        ("Liquidity", "Liquidity describes how easily an investment can be bought or sold near its current price.", "Popular NSE shares often have more buyers and sellers, making them easier to trade."),
    ]),
    (2, "Reading Stock Movements", [
        ("Bullish", "Bullish means an investor expects prices or a market trend to move higher.", "Strong results may make some investors bullish about a bank stock."),
        ("Bearish", "Bearish means an investor expects prices or a market trend to move lower.", "Weak results may make some investors bearish about an IT company."),
        ("Support", "Support is a price area where buying interest has previously slowed a fall.", "If a share repeatedly finds buyers near a level, traders may watch it as support."),
        ("Resistance", "Resistance is a price area where selling interest has previously slowed a rise.", "If a share repeatedly struggles near a level, traders may watch it as resistance."),
        ("Trend", "A trend is the general direction in which a price has been moving.", "A series of higher highs and higher lows can describe an upward trend."),
        ("Volatility", "Volatility describes how much and how quickly a share price moves.", "A share moving sharply in both directions during a session is showing volatility."),
        ("52-Week High", "The 52-week high is the highest recorded price during the previous year.", "A share trading close to its 52-week high has recently reached a yearly peak."),
        ("52-Week Low", "The 52-week low is the lowest recorded price during the previous year.", "A share trading close to its 52-week low has recently reached a yearly bottom."),
    ]),
    (3, "Fundamental Analysis", [
        ("Revenue", "Revenue is the money a company receives from selling its products or services.", "An Indian auto company earns revenue when customers buy its vehicles."),
        ("Profit", "Profit is what remains after a company subtracts its costs from its income.", "If a company earns ₹100 and spends ₹70, its profit before other adjustments is ₹30."),
        ("EPS", "Earnings per share shows how much profit belongs to each company share.", "An EPS of ₹10 means the company generated ₹10 of profit for each share in that period."),
        ("P/E Ratio", "P/E compares a company's share price with the earnings generated per share.", "If a company earns ₹10 per share and trades at ₹200, its P/E is 20."),
        ("P/B Ratio", "P/B compares a company's market price with the accounting value of its assets per share.", "A bank investor may compare its share price with its book value while researching it."),
        ("Dividend", "A dividend is money a company may distribute to eligible shareholders.", "A profitable NSE-listed company may announce a dividend per share."),
        ("ROE", "Return on equity measures how efficiently a company uses shareholder money to generate profit.", "An investor may compare the ROE of two Indian companies in the same industry."),
        ("Debt-to-Equity", "Debt-to-equity compares money borrowed by a company with shareholder equity.", "A company with more debt relative to equity may deserve closer risk analysis."),
    ]),
    (4, "Technical Analysis", [
        ("Moving Average", "A moving average smooths recent prices into an average that helps show a trend.", "A trader may compare an NSE share's price with its 20-day moving average."),
        ("RSI", "RSI is an indicator that compares recent upward and downward price movement.", "An RSI reading can help a learner study momentum, but it is not a guaranteed signal."),
        ("MACD", "MACD compares moving averages to help study changes in price momentum.", "A learner may watch MACD changes alongside the price chart of a stock."),
        ("Trading Volume", "Trading volume is the number of shares exchanged during a chosen period.", "A price breakout with higher volume can be studied differently from one with very low volume."),
        ("Breakout", "A breakout happens when price moves beyond a level it previously struggled to cross.", "A share moving above a watched resistance area may be described as a breakout."),
        ("Pullback", "A pullback is a temporary move against the recent price direction.", "A share in an upward trend may dip briefly before its next move."),
        ("Momentum", "Momentum describes the strength and speed of a price move.", "A rapidly rising share has positive price momentum, though the move can still reverse."),
        ("Trend Reversal", "A trend reversal is a change from an earlier upward or downward direction.", "A stock that stops making higher highs and begins falling may be watched for reversal clues."),
    ]),
    (5, "Risk Management", [
        ("Stop Loss", "A stop loss is a pre-decided level used to limit a potential loss on a trade.", "A trader may plan an exit if a share falls below a chosen level instead of waiting indefinitely."),
        ("Target Price", "A target price is a level an investor sets as a possible point to review a trade.", "A trader may set a review level after research, not as a guaranteed outcome."),
        ("Risk", "Risk is the possibility that an investment outcome differs from what you expected, including a loss.", "A share price can fall after unexpected company news, so invested money is not guaranteed."),
        ("Risk-Reward Ratio", "Risk-reward ratio compares the possible loss of a trade with its possible gain.", "A plan risking ₹1 to possibly gain ₹2 has a 1:2 risk-reward ratio."),
        ("Position Sizing", "Position sizing is deciding how much money or how many shares to place in one investment.", "A learner may buy fewer shares when a trade could create too much portfolio risk."),
        ("Diversification", "Diversification spreads money across different investments to avoid depending on one result.", "Holding companies from different sectors can reduce dependence on one sector's news."),
        ("Drawdown", "Drawdown is the fall from a portfolio's earlier high value to a later lower value.", "A portfolio falling from ₹10,000 to ₹9,000 has experienced a ₹1,000 drawdown."),
        ("Portfolio Risk", "Portfolio risk is the combined uncertainty from all investments held together.", "Several shares in the same sector can make a portfolio more exposed to that sector."),
    ]),
    (6, "Options Basics", [
        ("Call Option", "A call option gives its buyer a right, but not an obligation, to buy at a stated price.", "A learner buying a call pays a premium for the right to buy later under the contract terms."),
        ("Put Option", "A put option gives its buyer a right, but not an obligation, to sell at a stated price.", "A learner studying a put can see how it may provide downside exposure under contract terms."),
        ("Strike Price", "Strike price is the stated price at which an option right can be exercised.", "A NIFTY option with a stated strike has that level written into its contract."),
        ("Premium", "Premium is the price paid by an option buyer for the option contract.", "The buyer pays the quoted premium whether or not the option later becomes useful."),
        ("Expiry", "Expiry is the date when an option contract ends under its exchange rules.", "An option must be evaluated before its expiry because time does not continue indefinitely."),
        ("Intrinsic Value", "Intrinsic value is the immediate exercise value an option may have before other factors.", "A call can have intrinsic value when the underlying price is above its strike."),
        ("Time Value", "Time value is the part of an option premium linked to time remaining and uncertainty.", "An option with more time before expiry can have time value even without intrinsic value."),
        ("Option Risk", "Option risk includes losing premium and facing complex price, time, and volatility changes.", "A beginner should understand the contract before trading options; losses are not guaranteed to be limited in every strategy."),
    ]),
]

LESSONS = []
for level, level_name, concepts in CURRICULUM:
    for offset in range(0, len(concepts), 4):
        day_number = len(LESSONS) + 1
        terms = []
        for index, (name, meaning, example) in enumerate(concepts[offset:offset + 4]):
            correct_index = (index + day_number) % 4
            options = [example, "It describes a company's office location.", "It is a guaranteed method of earning money.", "It only applies after an investment has been sold."]
            options[0], options[correct_index] = options[correct_index], options[0]
            terms.append({
                "name": name,
                "simple_meaning": meaning,
                "example": example,
                "context_key": "nifty" if name in {"Bullish", "Bearish", "Trend", "Volatility", "Trading Volume"} else "stock" if name in {"Market Price", "Volume", "52-Week High", "52-Week Low"} else None,
                "quiz": {
                    "question": f"Which situation best illustrates {name}?",
                    "options": options,
                    "correct_answer": correct_index,
                    "explanation": meaning,
                    "xp_reward": 20,
                },
            })
        LESSONS.append({"lesson_id": f"curriculum-day-{day_number}", "day_number": day_number, "level": level, "level_name": level_name, "topic": level_name, "terms": terms})

LESSON_START_DATE = date(2026, 9, 17)


def get_daily_lesson(current_date: Optional[date] = None) -> dict:
    selected_date = current_date or date.today()
    elapsed_days = (selected_date - LESSON_START_DATE).days
    return {**LESSONS[elapsed_days % len(LESSONS)], "date": selected_date.isoformat()}
