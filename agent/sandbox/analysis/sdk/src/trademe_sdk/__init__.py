import json
import os
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

OUTPUT_PATH = Path("/workspace/output.json")
DEFAULT_TIMEOUT_SECONDS = 20


def _get_ticker_key(ticker: Any) -> str:
    return str(ticker).upper()


def _api_base_url() -> str:
    value = os.environ.get("TRADEME_API_BASE_URL")
    if not value:
        raise RuntimeError("TRADEME_API_BASE_URL is not configured")
    return value.rstrip("/")


def _api_token() -> str:
    value = os.environ.get("TRADEME_API_TOKEN")
    if not value:
        raise RuntimeError("TRADEME_API_TOKEN is not configured")
    return value


def _get(path: str, params: dict[str, Any] | None = None) -> Any:
    query = urlencode({key: value for key, value in (params or {}).items() if value is not None})
    url = f"{_api_base_url()}{path}"
    if query:
        url = f"{url}?{query}"

    request = Request(url, headers={
        "Authorization": f"Bearer {_api_token()}",
        "Accept": "application/json",
    })

    try:
        with urlopen(request, timeout=DEFAULT_TIMEOUT_SECONDS) as response:
            body = response.read().decode("utf-8")
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"TradeMe API request failed with HTTP {exc.code}: {body}") from exc
    except URLError as exc:
        raise RuntimeError(f"TradeMe API request failed: {exc.reason}") from exc

    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise RuntimeError("TradeMe API returned invalid JSON") from exc

    if not payload.get("ok"):
        raise RuntimeError(f"TradeMe API error: {payload.get('error', 'unknown error')}")
    return payload.get("data")


class _Input:
    def load(self) -> dict[str, Any]:
        return {
            "run": self.metadata(),
            "data": {},
        }

    def metadata(self) -> dict[str, Any]:
        return {}

    def available_tickers(self) -> list[str]:
        return []


class _Output:
    def write(self, summary: str, result: Any) -> None:
        if not isinstance(summary, str) or not summary.strip():
            raise ValueError("summary must be a non-empty string")
        OUTPUT_PATH.write_text(json.dumps({
            "summary": summary.strip(),
            "result": result,
        }, default=str, ensure_ascii=False))

    def fail(self, summary: str, details: Any = None) -> None:
        self.write(summary, {"error": details or summary})


class _Portfolio:
    def dashboard(self) -> dict[str, Any]:
        return _get("/api/sandbox/portfolio/dashboard")

    def summary(self) -> dict[str, Any] | None:
        dashboard = self.dashboard()
        return dashboard.get("summary") if dashboard else None

    def positions(self) -> list[dict[str, Any]]:
        dashboard = self.dashboard()
        return dashboard.get("positions", []) if dashboard else []

    def position(self, ticker: str) -> dict[str, Any] | None:
        symbol = _get_ticker_key(ticker)
        for position in self.positions():
            if _get_ticker_key(position.get("ticker")) == symbol:
                return position
        return None


class _Market:
    def quote(self, ticker: str) -> Any:
        return _get("/api/sandbox/market/quote", {"ticker": _get_ticker_key(ticker)})

    def candles(self, ticker: str, from_: str | None = None, to: str | None = None, **kwargs: Any) -> list[dict[str, Any]]:
        from_value = from_ or kwargs.get("from_date") or kwargs.get("from")
        to_value = to or kwargs.get("to_date")
        if not from_value or not to_value:
            raise ValueError("candles requires from_ and to dates in YYYY-MM-DD format")
        return _get("/api/sandbox/market/candles", {
            "ticker": _get_ticker_key(ticker),
            "from": from_value,
            "to": to_value,
        })

    def fundamentals(self, ticker: str) -> Any:
        return _get("/api/sandbox/market/fundamentals", {"ticker": _get_ticker_key(ticker)})


class _News:
    def recent(self, ticker: str, days: int = 7) -> list[dict[str, Any]]:
        return _get("/api/sandbox/market/news", {
            "ticker": _get_ticker_key(ticker),
            "days": days,
        })


class _Utils:
    def closes(self, candles: list[dict[str, Any]]) -> list[float]:
        return [float(c["close"]) for c in candles if c.get("close") is not None]

    def returns(self, values: list[float]) -> list[float]:
        result = []
        for prev, cur in zip(values[:-1], values[1:]):
            if prev:
                result.append((cur - prev) / prev)
        return result


input = _Input()
output = _Output()
portfolio = _Portfolio()
market = _Market()
news = _News()
utils = _Utils()


# Backward-compatible shims for existing generated code during prototyping.
def load_input() -> dict[str, Any]:
    return input.load()


def write_output(value: Any) -> None:
    if isinstance(value, dict) and "summary" in value and "result" in value:
        output.write(value["summary"], value["result"])
    else:
        output.write("Analysis completed.", value)


def closes(candles: list[dict[str, Any]]) -> list[float]:
    return utils.closes(candles)
