-- Cleanup legacy helper view.
-- This view is no longer needed because admin.html is the editing UI.

drop view if exists public.products_edit_view;
