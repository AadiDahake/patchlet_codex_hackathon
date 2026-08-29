import os
from pathlib import Path

import pytest

from steps import applier


def test_safe_join_rejects_traversal_and_absolute(tmp_path: Path) -> None:
    for bad in ("../x.ts", "a/../../x.ts", "/etc/passwd", ".git/config", "", "a\x00b"):
        with pytest.raises(applier.UnsafePath):
            applier.safe_join(tmp_path, bad)


def test_safe_join_rejects_symlink_escape(tmp_path: Path) -> None:
    outside = tmp_path / "outside"
    outside.mkdir()
    root = tmp_path / "repo"
    root.mkdir()
    os.symlink(outside, root / "link")
    with pytest.raises(applier.UnsafePath):
        applier.safe_join(root, "link/file.ts")


def test_safe_join_accepts_nested_new_paths(tmp_path: Path) -> None:
    target = applier.safe_join(tmp_path, "components/ThemeToggle.tsx")
    assert target == tmp_path.resolve() / "components" / "ThemeToggle.tsx"


def test_apply_files_writes_all_and_returns_originals(tmp_path: Path) -> None:
    (tmp_path / "a.ts").write_text("old a\n")
    originals = applier.apply_files(tmp_path, {"a.ts": "new a\n", "b/c.ts": "new c\n"})
    assert originals == {"a.ts": "old a\n", "b/c.ts": None}
    assert (tmp_path / "a.ts").read_text() == "new a\n"
    assert (tmp_path / "b" / "c.ts").read_text() == "new c\n"


def test_apply_files_is_atomic_on_bad_path(tmp_path: Path) -> None:
    (tmp_path / "a.ts").write_text("old a\n")
    with pytest.raises(applier.UnsafePath):
        applier.apply_files(tmp_path, {"a.ts": "new a\n", "../escape.ts": "x"})
    assert (tmp_path / "a.ts").read_text() == "old a\n"
    assert not (tmp_path.parent / "escape.ts").exists()


def test_restore_removes_new_files_and_rewrites_old(tmp_path: Path) -> None:
    (tmp_path / "a.ts").write_text("old a\n")
    originals = applier.apply_files(tmp_path, {"a.ts": "new a\n", "n.ts": "new\n"})
    applier.restore(tmp_path, originals)
    assert (tmp_path / "a.ts").read_text() == "old a\n"
    assert not (tmp_path / "n.ts").exists()
