"""Thin wrapper around the Notion REST API using httpx.

All Notion operations go through this module.  Reads the API token from
the $NOTION_API env var (falling back to config file).
"""

from __future__ import annotations

from typing import Any

import httpx

from gym_coach.config import get_notion_token

BASE_URL = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


class NotionClient:
    """Low-level Notion REST API client."""

    def __init__(self, token: str | None = None) -> None:
        self.token = token or get_notion_token()
        if not self.token:
            raise ValueError(
                "Notion API token not found. Set $NOTION_API or run `coach init`."
            )
        self._client = httpx.Client(
            base_url=BASE_URL,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

    def _request(self, method: str, path: str, **kwargs: Any) -> dict:
        resp = self._client.request(method, path, **kwargs)
        resp.raise_for_status()
        return resp.json()

    # ─── Pages ────────────────────────────────────────────────

    def get_page(self, page_id: str) -> dict:
        """GET /pages/{id}"""
        return self._request("GET", f"/pages/{page_id}")

    def create_page(
        self,
        parent: dict,
        properties: dict,
        children: list[dict] | None = None,
    ) -> dict:
        """POST /pages — create a new page."""
        body: dict[str, Any] = {"parent": parent, "properties": properties}
        if children:
            body["children"] = children
        return self._request("POST", "/pages", json=body)

    def update_page(self, page_id: str, properties: dict) -> dict:
        """PATCH /pages/{id} — update page properties."""
        return self._request("PATCH", f"/pages/{page_id}", json={"properties": properties})

    def trash_page(self, page_id: str) -> dict:
        """PATCH /pages/{id} — move to trash."""
        return self._request("PATCH", f"/pages/{page_id}", json={"in_trash": True})

    # ─── Databases ────────────────────────────────────────────

    def create_database(
        self,
        parent: dict,
        title: str,
        properties: dict,
    ) -> dict:
        """POST /databases — create an inline database (child of a page)."""
        body: dict[str, Any] = {
            "parent": parent,
            "title": [{"type": "text", "text": {"content": title}}],
            "properties": properties,
        }
        return self._request("POST", "/databases", json=body)

    def query_database(
        self,
        database_id: str,
        filter: dict | None = None,
        sorts: list[dict] | None = None,
        page_size: int = 100,
    ) -> list[dict]:
        """POST /databases/{id}/query — returns all pages (handles pagination)."""
        body: dict[str, Any] = {"page_size": page_size}
        if filter:
            body["filter"] = filter
        if sorts:
            body["sorts"] = sorts

        all_results: list[dict] = []
        has_more = True
        start_cursor = None

        while has_more:
            if start_cursor:
                body["start_cursor"] = start_cursor
            resp = self._request("POST", f"/databases/{database_id}/query", json=body)
            all_results.extend(resp.get("results", []))
            has_more = resp.get("has_more", False)
            start_cursor = resp.get("next_cursor")

        return all_results

    # ─── Blocks ───────────────────────────────────────────────

    def get_block_children(self, block_id: str) -> list[dict]:
        """GET /blocks/{id}/children — returns all children (handles pagination)."""
        all_children: list[dict] = []
        has_more = True
        start_cursor = None

        while has_more:
            params: dict[str, Any] = {"page_size": 100}
            if start_cursor:
                params["start_cursor"] = start_cursor
            resp = self._request("GET", f"/blocks/{block_id}/children", params=params)
            all_children.extend(resp.get("results", []))
            has_more = resp.get("has_more", False)
            start_cursor = resp.get("next_cursor")

        return all_children

    def append_block_children(self, block_id: str, children: list[dict]) -> dict:
        """PATCH /blocks/{id}/children — append child blocks."""
        return self._request(
            "PATCH", f"/blocks/{block_id}/children", json={"children": children}
        )

    def update_block(self, block_id: str, data: dict) -> dict:
        """PATCH /blocks/{id} — update a block."""
        return self._request("PATCH", f"/blocks/{block_id}", json=data)

    # ─── Helpers ──────────────────────────────────────────────

    def find_child_database(self, page_id: str) -> str | None:
        """Scan a page's children for a child_database block, return its ID."""
        children = self.get_block_children(page_id)
        for block in children:
            if block.get("type") == "child_database":
                return block["id"]
        return None
