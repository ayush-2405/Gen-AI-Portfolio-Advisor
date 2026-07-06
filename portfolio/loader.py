import pandas as pd

REQUIRED_COLUMNS = ["ticker"]

YF_TICKER_MAP = {
    "BRK.B": "BRK-B",
    "BRK/A": "BRK-A",
}


def load_portfolio(csv_file):

    df = pd.read_csv(csv_file)

    df.columns = [c.strip().lower() for c in df.columns]

    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    if "shares" not in df.columns and "amount" not in df.columns:
        raise ValueError("CSV must contain either 'shares' or 'amount'.")

    df["ticker"] = (
        df["ticker"]
        .astype(str)
        .str.upper()
        .str.strip()
    )

    df["ticker"] = df["ticker"].replace(YF_TICKER_MAP)

    if "shares" in df.columns:
        df["shares"] = pd.to_numeric(
            df["shares"],
            errors="coerce"
        ).fillna(0)

    if "amount" in df.columns:
        df["amount"] = pd.to_numeric(
            df["amount"],
            errors="coerce"
        ).fillna(0)

    return df


def build_portfolio(df, latest_prices):

    portfolio = df.copy()

    portfolio["latest_price"] = portfolio["ticker"].map(latest_prices)

    portfolio = portfolio.dropna(subset=["latest_price"])

    if "shares" in portfolio.columns:

        portfolio["market_value"] = (
            portfolio["shares"]
            * portfolio["latest_price"]
        )

    else:

        portfolio["market_value"] = portfolio["amount"]

        portfolio["shares"] = (
            portfolio["amount"]
            / portfolio["latest_price"]
        )

    total = portfolio["market_value"].sum()

    portfolio["weight"] = (
        portfolio["market_value"]
        / total
    )

    return portfolio


def attach_company_metadata(portfolio, metadata):

    meta = pd.DataFrame(metadata)

    return portfolio.merge(
        meta,
        on="ticker",
        how="left"
    )


def portfolio_summary(portfolio):

    return {

        "total_value":
            float(portfolio["market_value"].sum()),

        "num_holdings":
            int(portfolio["ticker"].nunique()),

        "largest_position":
            portfolio.sort_values(
                "weight",
                ascending=False
            ).iloc[0]["ticker"],

        "largest_weight":
            float(portfolio["weight"].max())

    }


def sector_weights(portfolio):

    return (
        portfolio
        .groupby("sector")["weight"]
        .sum()
        .sort_values(ascending=False)
    )


def top_holdings(
    portfolio,
    n=10
):

    return portfolio.sort_values(
        "market_value",
        ascending=False
    ).head(n)