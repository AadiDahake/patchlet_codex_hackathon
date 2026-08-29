from pathlib import Path

from steps import repo
from steps.codegen import strip_fences


def _fixture() -> Path:
    return Path(__file__).parent / "fixtures" / "mini-next-app"


def test_keywords_expand_synonyms_and_drop_stopwords() -> None:
    terms = repo.keywords("Add dark mode", "Users want a dark theme")
    assert "dark" in terms and "theme" in terms and "tokens" in terms
    assert "the" not in terms and "add" not in terms


def test_rank_files_puts_tokens_and_header_first_for_dark_mode() -> None:
    root = _fixture()
    paths = repo.list_source_files(root)
    assert "package-lock.json" not in paths
    assert "styles/tokens.css" in paths
    ranked = repo.rank_files(root, paths, repo.keywords("Add dark mode", "a dark theme toggle in the header"), limit=5)
    top = [path for path, _ in ranked]
    assert top[0] == "styles/tokens.css"
    assert "components/HeaderActions.tsx" in top
    assert "AGENTS.md" in top


def test_rank_files_is_deterministic() -> None:
    root = _fixture()
    paths = repo.list_source_files(root)
    terms = repo.keywords("keyboard shortcut to open search")
    assert repo.rank_files(root, paths, terms) == repo.rank_files(root, paths, terms)


def test_strip_fences() -> None:
    assert strip_fences("```tsx\nconst a = 1;\n```") == "const a = 1;\n"
    assert strip_fences("```\nx\n```\n") == "x\n"
    assert strip_fences("plain\n") == "plain\n"
    assert strip_fences("no newline") == "no newline\n"
