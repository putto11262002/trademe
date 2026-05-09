#!/usr/bin/env python3
"""Generate the code-analysis skill SDK reference from the Python SDK source."""

from __future__ import annotations

from pathlib import Path
import sys
import textwrap

ROOT = Path(__file__).resolve().parents[2]
SDK_SRC = ROOT / "agent/sandbox/analysis/sdk/src"
OUTPUT = ROOT / "skills/code-analysis-env/references/sdk.md"
ROOT_CLASS = "TradeMeSDK"


def main() -> None:
    try:
        import griffe
    except ImportError as exc:
        raise SystemExit(
            "Missing Python package 'griffe'. Install it with:\n"
            "  python3 -m pip install 'griffe>=1,<2'"
        ) from exc

    module = griffe.load("trademe_sdk", search_paths=[str(SDK_SRC)])
    content = render_reference(module)
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


def render_reference(module) -> str:
    return "\n".join([
        "# TradeMe Python SDK Reference",
        "",
        "Generated analysis code imports the SDK as:",
        "",
        "```python",
        "import trademe_sdk as trademe",
        "```",
        "",
        "`trademe` exposes the namespace instances documented below.",
        "",
        *render_namespaces(module),
        *render_types(module),
    ]).rstrip() + "\n"


def render_namespaces(module) -> list[str]:
    root = module[ROOT_CLASS]
    parts: list[str] = ["## Namespaces", ""]
    for namespace, namespace_type in iter_root_namespaces(root):
        cls = module[namespace_type]
        parts.extend([f"### `trademe.{namespace}`", ""])
        if cls.docstring:
            parts.extend([first_paragraph(cls.docstring.value), ""])

        for method_name, member in cls.members.items():
            if not getattr(member, "is_function", False):
                continue
            signature = str(member.signature()).replace(f"{method_name}(", f"trademe.{namespace}.{method_name}(")
            parts.extend([f"#### `{signature}`", ""])
            doc = normalize_docstring(member.docstring.value if member.docstring else "")
            if doc:
                parts.extend([doc, ""])
            if member.returns:
                parts.extend([f"Returns: `{member.returns}`", ""])
    return parts


def iter_root_namespaces(root) -> list[tuple[str, str]]:
    namespaces: list[tuple[str, str]] = []
    for name, member in root.members.items():
        if name.startswith("_") or not getattr(member, "is_attribute", False):
            continue
        annotation = getattr(member, "annotation", None)
        if annotation is None:
            continue
        namespaces.append((name, str(annotation)))
    return namespaces


def render_types(module) -> list[str]:
    names = sorted(discover_typed_dicts(module), key=lambda name: module[name].lineno)
    parts: list[str] = ["## Return Shapes", ""]
    for name in names:
        cls = module[name]
        parts.extend([f"### `{name}`", ""])
        if cls.docstring:
            parts.extend([normalize_docstring(cls.docstring.value), ""])
        parts.extend(["```python", f"class {name}(TypedDict):"])
        for attr_name, attr in cls.members.items():
            annotation = getattr(attr, "annotation", None)
            if annotation is not None:
                parts.append(f"    {attr_name}: {annotation}")
        parts.extend(["```", ""])
    return parts


def discover_typed_dicts(module) -> set[str]:
    result: set[str] = set()
    for name, member in module.members.items():
        if name.startswith("_") or member.kind.value != "class":
            continue
        bases = [str(base) for base in getattr(member, "bases", [])]
        if "TypedDict" in bases:
            result.add(name)
    return result


def first_paragraph(value: str) -> str:
    return textwrap.dedent(value).strip().split("\n\n", 1)[0]


def normalize_docstring(value: str) -> str:
    value = textwrap.dedent(value).strip()
    if not value:
        return ""

    lines = []
    in_params = False
    in_notes = False
    for raw_line in value.splitlines():
        line = raw_line.rstrip()
        if line == "Parameters:":
            in_params = True
            in_notes = False
            lines.extend(["", "Parameters:"])
            continue
        if line == "Notes:":
            in_params = False
            in_notes = True
            lines.extend(["", "Notes:"])
            continue
        if in_params and line.startswith("    "):
            stripped = line.strip()
            if ": " in stripped:
                name, text = stripped.split(": ", 1)
                lines.append(f"- `{name}`: {text}")
            else:
                lines.append(f"  {stripped}")
            continue
        if in_notes and line.startswith("    "):
            lines.append(line.strip())
            continue
        lines.append(line)
    return "\n".join(lines).strip()


if __name__ == "__main__":
    sys.exit(main())
