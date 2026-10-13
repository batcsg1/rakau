from rest_framework.pagination import PageNumberPagination


class MyTreesPagination(PageNumberPagination):
    # Matches the client's infinite scroll; an out-of-range ?page= returns 404 "Invalid page."
    page_size = 20
