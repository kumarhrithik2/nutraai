"""Async pagination. DRF's paginators run blocking queries, so async views use this."""
import math

from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.utils.urls import remove_query_param, replace_query_param

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def _int_param(request, name, default, *, max_value=None) -> int:
    raw = request.query_params.get(name)
    if raw in (None, ""):
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise ValidationError({name: ["A valid integer is required."]})
    if value < 1:
        raise ValidationError({name: ["Ensure this value is greater than or equal to 1."]})
    return min(value, max_value) if max_value else value


async def paginate(request, queryset, serializer_class, *, context=None) -> Response:
    """Return {count, page, page_size, total_pages, next, previous, results}.

    The queryset MUST be ordered, and any related rows the serializer reads must be loaded
    with select_related / prefetch_related (async code cannot lazy-load them).
    """
    page = _int_param(request, "page", 1)
    page_size = _int_param(request, "page_size", DEFAULT_PAGE_SIZE, max_value=MAX_PAGE_SIZE)

    count = await queryset.acount()
    total_pages = max(1, math.ceil(count / page_size))
    if page > total_pages:
        raise NotFound("That page does not exist.")

    offset = (page - 1) * page_size
    items = [obj async for obj in queryset[offset : offset + page_size]]
    data = serializer_class(items, many=True, context={"request": request, **(context or {})}).data

    url = request.build_absolute_uri()
    next_url = replace_query_param(url, "page", page + 1) if page < total_pages else None
    if page > 1:
        previous_url = (
            remove_query_param(url, "page") if page == 2 else replace_query_param(url, "page", page - 1)
        )
    else:
        previous_url = None

    return Response(
        {
            "count": count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "next": next_url,
            "previous": previous_url,
            "results": data,
        }
    )
