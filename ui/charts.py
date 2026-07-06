import plotly.express as px
import plotly.graph_objects as go


def sector_pie(portfolio):

    fig = px.pie(
        portfolio,
        names="sector",
        values="weight",
        hole=0.45,
        title="Sector Allocation"
    )

    fig.update_layout(
        legend_title="Sector"
    )

    return fig


def marketcap_pie(portfolio):

    fig = px.pie(
        portfolio,
        names="market_cap_bucket",
        values="weight",
        hole=0.45,
        title="Market Cap Allocation"
    )

    return fig


def holdings_bar(portfolio):

    df = portfolio.sort_values(
        "market_value",
        ascending=False
    )

    fig = px.bar(
        df,
        x="ticker",
        y="market_value",
        title="Holding Values"
    )

    return fig


def weight_bar(portfolio):

    df = portfolio.sort_values(
        "weight",
        ascending=False
    )

    fig = px.bar(
        df,
        x="ticker",
        y="weight",
        title="Portfolio Weights"
    )

    return fig


def beta_bar(portfolio):

    fig = px.bar(
        portfolio,
        x="ticker",
        y="beta",
        title="Individual Stock Betas"
    )

    return fig


def correlation_heatmap(correlation):

    fig = px.imshow(
        correlation,
        text_auto=".2f",
        aspect="auto",
        title="Correlation Matrix"
    )

    return fig


def cumulative_returns_chart(cumulative):

    fig = go.Figure()

    for col in cumulative.columns:

        fig.add_trace(

            go.Scatter(

                x=cumulative.index,

                y=cumulative[col],

                mode="lines",

                name=col

            )

        )

    fig.update_layout(

        title="Portfolio vs Benchmark",

        xaxis_title="Date",

        yaxis_title="Cumulative Return"

    )

    return fig


def drawdown_chart(drawdown):

    fig = go.Figure()

    fig.add_trace(

        go.Scatter(

            x=drawdown.index,

            y=drawdown,

            fill="tozeroy"

        )

    )

    fig.update_layout(

        title="Drawdown"

    )

    return fig


def risk_return_scatter(metrics):

    fig = px.scatter(

        metrics,

        x="Annual Volatility",

        y="Annual Return",

        text="Asset"

    )

    fig.update_traces(

        textposition="top center"

    )

    return fig