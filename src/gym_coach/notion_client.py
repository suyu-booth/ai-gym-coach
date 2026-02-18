"""Thin wrapper around the official Notion Python SDK.

Handles authentication, database queries, page reads/writes, and — critically —
child block operations needed to access the inline "Weight Tracking Log" tables
inside each workout page.
"""

from __future__ import annotations

import logging
from typing import Any

from notion_client import Client

logger = logging.getLogger(__name__)


class NotionGymClient:
    """Wrapper for all Notion API operations needed by the gym coach."""

    def __init__(self, token: str) -> None:
        self._client = Client(auth=token)

    # ── Database operations ───────────────────────────────────

    def query_database(
        self,
        database_id: str,
        filter_obj: dict[str, Any] | None = None,
        sorts: list[dict[str, Any]] | None = None,
        page_size: int = 100,
    ) -> list[dict[str, Any]]:
        """Query a Notion database and return all matching pages (handles pagination)."""
        pages: list[dict[str, Any]] = []
        kwargs: dict[str, Any] = {"database_id": database_id, "page_size": page_size}
        if filter_obj:
            kwargs["filter"] = filter_obj
        if sorts:
            kwargs["sorts"] = sorts

        has_more = True
        while has_more:
            response = self._client.databases.query(**kwargs)
            pages.extend(response.get("results", []))
            has_more = response.get("has_more", False)
            if has_more:
                kwargs["start_cursor"] = response["next_cursor"]
        return pages

    def get_database_schema(self, database_id: str) -> dict[str, Any]:
        """Retrieve the schema (properties) of a database."""
        return self._client.databases.retrieve(database_id=database_id)

    # ── Page operations ───────────────────────────────────────

    def get_page(self, page_id: str) -> dict[str, Any]:
        """Retrieve a single page by ID."""
        return self._client.pages.retrieve(page_id=page_id)

    def create_page(
        self,
        database_id: str,
        properties: dict[str, Any],
        children: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Create a new page in a database with optional child blocks."""
        kwargs: dict[str, Any] = {
            "parent": {"database_id": database_id},
            "properties": properties,
        }
        if children:
            kwargs["children"] = children
        return self._client.pages.create(**kwargs)

    def update_page(self, page_id: str, properties: dict[str, Any]) -> dict[str, Any]:
        """Update page properties."""
        return self._client.pages.update(page_id=page_id, properties=properties)

    # ── Block operations (for nested child databases) ─────────

    def get_block_children(self, block_id: str) -> list[dict[str, Any]]:
        """List all child blocks of a page/block (handles pagination)."""
        blocks: list[dict[str, Any]] = []
        kwargs: dict[str, Any] = {"block_id": block_id, "page_size": 100}
        has_more = True
        while has_more:
            response = self._client.blocks.children.list(**kwargs)
            blocks.extend(response.get("results", []))
            has_more = response.get("has_more", False)
            if has_more:
                kwargs["start_cursor"] = response["next_cursor"]
        return blocks

    def append_block_children(
        self, block_id: str, children: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Append child blocks to a page/block."""
        return self._client.blocks.children.append(
            block_id=block_id, children=children
        )

    def find_child_database(self, page_id: str) -> str | None:
        """Find the first inline (child) database block inside a page.

        Returns the database ID or ``None`` if not found.
        """
        blocks = self.get_block_children(page_id)
        for block in blocks:
            if block.get("type") == "child_database":
                return block["id"]
        return None

    def query_child_database(self, database_id: str) -> list[dict[str, Any]]:
        """Query an inline child database (e.g., the Weight Tracking Log)."""
        return self.query_database(database_id)

    # ── Convenience: update a row in a child database ─────────

    def update_child_row(self, row_page_id: str, properties: dict[str, Any]) -> dict[str, Any]:
        """Update properties on a row (which is a page) in a child database."""
        return self._client.pages.update(page_id=row_page_id, properties=properties)

    # ── Connection test ───────────────────────────────────────

    def test_connection(self, database_id: str) -> dict[str, Any]:
        """Test the connection by retrieving the database metadata.

        Returns the database object on success, raises on failure.
        """
        return self._client.databases.retrieve(database_id=database_id)
