from datetime import date


LESSONS = [
    {
        "lesson_id": "market-basics-day-1",
        "day_number": 1,
        "topic": "Stock Market Basics",
        "terms": [
            {
                "name": "Stock",
                "simple_meaning": "A stock represents a small ownership interest in a company.",
                "example": "If you own shares of an Indian company, you own a small portion of that company."
            },
            {
                "name": "NSE",
                "simple_meaning": "The National Stock Exchange is a major marketplace where Indian shares are traded.",
                "example": "Reliance and TCS shares can be bought or sold through the NSE during market hours."
            },
            {
                "name": "Market Price",
                "simple_meaning": "Market price is the latest price buyers and sellers are agreeing on for a share.",
                "example": "If Infosys is trading at ₹1,500, that is its current market price at that moment."
            },
            {
                "name": "Portfolio",
                "simple_meaning": "A portfolio is the collection of investments owned by an investor.",
                "example": "A portfolio containing Reliance and TCS shares has two different investments."
            }
        ]
    },
    {
        "lesson_id": "market-basics-day-2",
        "day_number": 2,
        "topic": "Size, Trading Activity, and Movement",
        "terms": [
            {
                "name": "Market Capitalization",
                "simple_meaning": "Market capitalization is the total market value of all a company's shares.",
                "example": "A large Indian company with many valuable shares may be called a large-cap company."
            },
            {
                "name": "Volume",
                "simple_meaning": "Volume is the number of shares traded during a period.",
                "example": "A sudden increase in TCS trading volume means many shares changed hands that day."
            },
            {
                "name": "Liquidity",
                "simple_meaning": "Liquidity describes how easily an investment can be bought or sold near its current price.",
                "example": "Popular NSE shares often have more buyers and sellers, making them easier to trade."
            },
            {
                "name": "Volatility",
                "simple_meaning": "Volatility describes how much and how quickly a share price moves.",
                "example": "An Adani group share moving sharply in both directions during a session is showing volatility."
            }
        ]
    },
    {
        "lesson_id": "market-basics-day-3",
        "day_number": 3,
        "topic": "Reading Price Trends",
        "terms": [
            {
                "name": "Bullish",
                "simple_meaning": "Bullish means an investor expects prices or a market trend to move higher.",
                "example": "A trader may feel bullish about a bank stock after encouraging earnings news."
            },
            {
                "name": "Bearish",
                "simple_meaning": "Bearish means an investor expects prices or a market trend to move lower.",
                "example": "Weak results may make some investors bearish about an IT company."
            },
            {
                "name": "Support",
                "simple_meaning": "Support is a price area where buying interest has previously slowed a fall.",
                "example": "If a share repeatedly finds buyers near ₹1,000, traders may watch ₹1,000 as support."
            },
            {
                "name": "Resistance",
                "simple_meaning": "Resistance is a price area where selling interest has previously slowed a rise.",
                "example": "If a share repeatedly struggles near ₹1,200, traders may watch ₹1,200 as resistance."
            }
        ]
    },
    {
        "lesson_id": "market-basics-day-4",
        "day_number": 4,
        "topic": "Understanding Company Results",
        "terms": [
            {
                "name": "Revenue",
                "simple_meaning": "Revenue is the money a company receives from selling its products or services.",
                "example": "An Indian auto company earns revenue when customers buy its vehicles."
            },
            {
                "name": "Profit",
                "simple_meaning": "Profit is what remains after a company subtracts its costs from its income.",
                "example": "If a company earns ₹100 and spends ₹70, its profit before other adjustments is ₹30."
            },
            {
                "name": "EPS",
                "simple_meaning": "Earnings per share shows how much profit belongs to each company share.",
                "example": "An EPS of ₹10 means the company generated ₹10 of profit for each share in that period."
            },
            {
                "name": "P/E Ratio",
                "simple_meaning": "P/E compares a company's share price with the earnings generated per share.",
                "example": "If a company earns ₹10 per share and trades at ₹200, its P/E is 20."
            }
        ]
    },
    {
        "lesson_id": "market-basics-day-5",
        "day_number": 5,
        "topic": "Company Actions for Shareholders",
        "terms": [
            {
                "name": "Dividend",
                "simple_meaning": "A dividend is money a company may distribute to eligible shareholders.",
                "example": "A profitable NSE-listed company may announce a ₹5 dividend per share."
            },
            {
                "name": "Stock Split",
                "simple_meaning": "A stock split divides existing shares into more shares while adjusting the price proportionally.",
                "example": "A 1:2 split can turn one ₹1,000 share into two shares priced near ₹500 each."
            },
            {
                "name": "Bonus Shares",
                "simple_meaning": "Bonus shares are additional shares given to eligible shareholders without a separate purchase payment.",
                "example": "In a 1:1 bonus issue, an investor holding 10 eligible shares may receive 10 more."
            },
            {
                "name": "Buyback",
                "simple_meaning": "A buyback is when a company offers to purchase some of its own shares.",
                "example": "An Indian company may announce a buyback at a stated price and set an acceptance process."
            }
        ]
    },
    {
        "lesson_id": "market-basics-day-6",
        "day_number": 6,
        "topic": "Managing Trading Risk",
        "terms": [
            {
                "name": "Stop Loss",
                "simple_meaning": "A stop loss is a pre-decided level used to limit a potential loss on a trade.",
                "example": "A trader may plan an exit if a share falls below a chosen level instead of waiting indefinitely."
            },
            {
                "name": "Target Price",
                "simple_meaning": "A target price is a level an investor sets as a possible point to review or exit a trade.",
                "example": "After researching a share, a trader may set ₹1,200 as a review level, not a guaranteed outcome."
            },
            {
                "name": "Risk",
                "simple_meaning": "Risk is the possibility that an investment outcome differs from what you expected, including a loss.",
                "example": "A share price can fall after unexpected company news, so invested money is not guaranteed."
            },
            {
                "name": "Risk-Reward Ratio",
                "simple_meaning": "Risk-reward ratio compares the possible loss of a trade with its possible gain.",
                "example": "A plan risking ₹1 to possibly gain ₹2 has a 1:2 risk-reward ratio."
            }
        ]
    },
    {
        "lesson_id": "market-basics-day-7",
        "day_number": 7,
        "topic": "Ways to Study the Market",
        "terms": [
            {
                "name": "Technical Analysis",
                "simple_meaning": "Technical analysis studies price, volume, and chart patterns to understand market behavior.",
                "example": "A trader may study an NSE share's trend and volume before deciding whether to research it further."
            },
            {
                "name": "Fundamental Analysis",
                "simple_meaning": "Fundamental analysis studies a company's business, finances, and valuation.",
                "example": "An investor may review an Indian company's revenue, profit, debt, and P/E ratio."
            },
            {
                "name": "Sentiment",
                "simple_meaning": "Sentiment is the overall positive, negative, or mixed feeling around a stock or market.",
                "example": "News about strong orders may create positive sentiment around an engineering company."
            },
            {
                "name": "AI Score",
                "simple_meaning": "An AI score combines selected data signals into a research indicator, not a promise of returns.",
                "example": "StockSikh's score can help learners review technical, news, and other signals together."
            }
        ]
    }
]

LESSON_START_DATE = date(2026, 9, 17)


def get_daily_lesson(current_date: date | None = None) -> dict:
    selected_date = current_date or date.today()
    elapsed_days = (selected_date - LESSON_START_DATE).days
    lesson = LESSONS[elapsed_days % len(LESSONS)]
    return {
        **lesson,
        "date": selected_date.isoformat(),
    }
