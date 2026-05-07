import json
from pathlib import Path
from typing import Any

INPUT_PATH = Path("/workspace/input.json")
OUTPUT_PATH = Path("/workspace/output.json")

_PAYLOAD: dict[str, Any] | None = None


def _load_payload() -> dict[str, Any]:
    global _PAYLOAD
    if _PAYLOAD is None:
        _PAYLOAD = json.loads(INPUT_PATH.read_text())
    return _PAYLOAD


def _get_ticker_key(ticker: Any) -> str:
    return str(ticker).upper()


class _Input:
    def load(self) -> dict[str, Any]:
        return _load_payload()

    def metadata(self) -> dict[str, Any]:
        return _load_payload().get("run", {})

    def available_tickers(self) -> list[str]:
        return _load_payload().get("data", {}).get("tickers", [])


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
    def dashboard(self) -> dict[str, Any] | None:
        return _load_payload().get("data", {}).get("portfolio")

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
    def _ticker_data(self, ticker: str) -> dict[str, Any]:
        return _load_payload().get("data", {}).get("market", {}).get(_get_ticker_key(ticker), {})

    def quote(self, ticker: str) -> Any:
        return self._ticker_data(ticker).get("quote")

    def candles(self, ticker: str) -> list[dict[str, Any]]:
        return self._ticker_data(ticker).get("candles", [])

    def fundamentals(self, ticker: str) -> Any:
        return self._ticker_data(ticker).get("fundamentals")


class _News:
    def recent(self, ticker: str) -> list[dict[str, Any]]:
        return _load_payload().get("data", {}).get("news", {}).get(_get_ticker_key(ticker), [])


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
