import datetime as dt
from zoneinfo import ZoneInfo

from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework import status
from rest_framework.decorators import action
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .serializers import (
    ItemSerializer,
    ReceiptSerializer,
    ReportCreateSerializer,
    ReportResponseSerializer,
    ReportSerializer,
)
from account.models import User
from receipt.models import Receipt, Report
from receipt.services.plots import build_statistics_plots
from moji_racuni_be import utils
from moji_racuni_be.permissions import IsAdminRole, IsRegularRole

#* Vremena računa i prijava se čuvaju kao lokalno (srpsko) vreme označeno kao UTC: tako ih upisuje
#* parser računa i tako ih FE prikazuje (dayjs.utc). Datum prijave koji postavlja server prati isto.
LOCAL_TIME_ZONE = ZoneInfo("Europe/Belgrade")


def _local_wall_time_now():
    return timezone.now().astimezone(LOCAL_TIME_ZONE).replace(tzinfo=dt.timezone.utc, microsecond=0)


def _is_admin(user):
    return user.role == User.Role.ADMIN


def _visible_receipts(user):
    """ADMIN vidi sve račune, REGULAR samo svoje (tuđi račun -> 404)."""
    return Receipt.objects.all() if _is_admin(user) else Receipt.objects.filter(user=user)


def _visible_reports(user):
    """ADMIN vidi sve prijave, REGULAR samo svoje (tuđa prijava -> 404)."""
    return Report.objects.all() if _is_admin(user) else Report.objects.filter(user=user)


def _get_or_404(queryset, pk):
    #* Neispravan ID (npr. tekst) daje 404 umesto 500 (ValueError iz baze)
    try:
        return get_object_or_404(queryset, pk=int(pk))
    except (TypeError, ValueError):
        raise Http404 from None


class ReceiptViewSet(viewsets.ViewSet):
    def get_permissions(self):
        #* Račune unose i poslednji račun gledaju samo REGULAR korisnici
        if self.action in ('create', 'retrieve_last'):
            return [IsRegularRole()]
        return super().get_permissions()

    @action(detail=False, url_path='total-spent', url_name='total-spent')
    def total_spent(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        total_spent_info = utils.get_total_spent(user, dateFrom, dateTo)
        return Response(total_spent_info)
    
    @action(detail=False, url_path='most-spent-day', url_name='most-spent-day')
    def most_spent_in_a_day(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        most_spent_day = utils.get_most_spent_in_a_day(user, dateFrom, dateTo)
        return Response(most_spent_day)
    
    @action(detail=False, url_path='hours-count', url_name='hours-count')
    def receipts_by_hour(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        receipts_count_by_hours = utils.get_receipts_sum_by_hours(user, dateFrom, dateTo)
        return Response(receipts_count_by_hours)
    
    @action(detail=False, url_path='weekdays-count', url_name='weekdays-count')
    def receipts_by_weekday(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        receipts_count_by_days = utils.get_receipts_sum_by_weekdays(user, dateFrom, dateTo)
        return Response(receipts_count_by_days)
    
    @action(detail=False, url_path='months-count', url_name='months-count')
    def receipts_by_month(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        receipts_count_by_months = utils.get_receipts_sum_by_months(user, dateFrom, dateTo)
        return Response(receipts_count_by_months)
    
    @action(detail=False, url_path='hours-spent', url_name='hours-spent')
    def spent_by_hour(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        money_spent_by_hours = utils.get_money_spent_by_hours(user, dateFrom, dateTo)
        return Response(money_spent_by_hours)
    
    @action(detail=False, url_path='weekdays-spent', url_name='weekdays-spent')
    def spent_by_weekday(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        money_spent_by_days = utils.get_money_spent_by_weekdays(user, dateFrom, dateTo)
        return Response(money_spent_by_days)
    
    @action(detail=False, url_path='months-spent', url_name='months-spent')
    def spent_by_month(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        money_spent_by_months = utils.get_money_spent_by_months(user, dateFrom, dateTo)
        return Response(money_spent_by_months)
    
    @action(detail=False, url_path='filter', url_name='filter')
    def filter_receipts(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        id = self.request.query_params.get('id')
        unitName = self.request.query_params.get('unitName')
        tin = self.request.query_params.get('tin')
        priceFrom = self.request.query_params.get('priceFrom')
        priceTo = self.request.query_params.get('priceTo')
        orderBy = self.request.query_params.get('orderBy')
        ascendingOrder = self.request.query_params.get('ascendingOrder')
        if (not dateFrom or not dateTo or not id or not unitName or not tin or not priceFrom or not priceTo or not orderBy or not ascendingOrder):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        filtered_receipts = utils.filter_receipts(user, dateFrom, dateTo, id, unitName, tin, priceFrom, priceTo, orderBy, ascendingOrder)
        p = Paginator(filtered_receipts, 12)
        try:
            page = p.page(self.request.query_params.get('page'))
        except (EmptyPage, PageNotAnInteger):
            page = p.page(1)
        res = {
            "pageCount": p.num_pages,
            "pageNum": page.number,
            "receipts": page.object_list
        }
        return Response(res)
    
    @action(detail=False, url_path='plot', url_name='plot')
    def plot_stat(self, request):
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        limit = self.request.query_params.get('limit')
        if (not dateFrom or not dateTo or not limit):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        return Response(build_statistics_plots(request.user, dateFrom, dateTo))

    def create(self, request):
        user = request.user
        receipts = user.receipt_set.all()
        receipt_link = request.data.get('url')
        for receipt in receipts:
            if (receipt.link == receipt_link):
                return Response(status=status.HTTP_409_CONFLICT)
        receipt = utils.retrieve_receipt(request.data.get('url'), request.data.get('companyUnit'), user.id)
        serializer = ReceiptSerializer(data=receipt)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        receipt = _get_or_404(_visible_receipts(request.user), pk)
        serializer = ReceiptSerializer(receipt)
        return Response(serializer.data)
    
    @action(detail=False, url_path='last', url_name='last')
    def retrieve_last(self, request):
        receipt = utils.get_last_receipt(request.user)
        if (receipt == None):
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(receipt)

    def destroy(self, request, pk=None):
        #* I ADMIN briše samo svoje račune (tuđi -> 404)
        receipt = _get_or_404(request.user.receipt_set, pk)
        receipt.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ItemViewSet(viewsets.ViewSet):
    def get_permissions(self):
        if self.action == 'create':
            return [IsRegularRole()]
        return super().get_permissions()

    @action(detail=True, url_path='receipt', url_name='receipt')
    def all(self, request, pk=None):
        receipt = _get_or_404(_visible_receipts(request.user), pk)
        items = receipt.item_set.all()
        serializer = ItemSerializer(items, many=True)    
        return Response(serializer.data)
    
    @action(detail=False, url_path='most-valuable', url_name='most-valuable')
    def most_valuable(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        limit = self.request.query_params.get('limit')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            item = utils.get_most_valuable_items(user, dateFrom, dateTo, int(limit))
            return Response(item)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, url_path='most-items', url_name='most-items')
    def most_items(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            most_items_on_receipt = utils.get_most_items_on_receipt(user, dateFrom, dateTo)
            return Response(most_items_on_receipt)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

    def create(self, request):
        #* Stavke se dodaju samo na sopstveni račun (tuđi -> 404, bez preuzimanja sa PURS-a)
        receipt = _get_or_404(request.user.receipt_set, request.data.get('receipt'))
        items = utils.retrieve_items(request.data.get('url'), receipt.id)
        is_valid = True
        for item in items:
            serializer = ItemSerializer(data=item)
            if serializer.is_valid():
                serializer.save()
            else:
                is_valid = False
        if is_valid:
            return Response(items, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportViewSet(viewsets.ViewSet):
    def get_permissions(self):
        #* Prijave podnose i označavaju kao viđene REGULAR korisnici; odgovara ADMIN
        if self.action in ('create', 'set_seen'):
            return [IsRegularRole()]
        if self.action in ('update', 'retrieve_last'):
            return [IsAdminRole()]
        return super().get_permissions()

    @action(detail=False, url_path='filter', url_name='filter')
    def filter_reports(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        id = self.request.query_params.get('id')
        receipt = self.request.query_params.get('receipt')
        username = self.request.query_params.get('user')
        request = self.request.query_params.get('request')
        orderBy = self.request.query_params.get('orderBy')
        ascendingOrder = self.request.query_params.get('ascendingOrder')
        if (not dateFrom or not dateTo or not id or not receipt or not username or not request or not orderBy or not ascendingOrder):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        filtered_reports = utils.filter_reports(user, dateFrom, dateTo, id, receipt, username, request, orderBy, ascendingOrder)
        p = Paginator(filtered_reports, 12)
        try:
            page = p.page(self.request.query_params.get('page'))
        except (EmptyPage, PageNotAnInteger):
            page = p.page(1)
        res = {
            "pageCount": p.num_pages,
            "pageNum": page.number,
            "reports": page.object_list
        }
        return Response(res)

    def create(self, request):
        serializer = ReportCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        report = serializer.save(user=request.user, date=_local_wall_time_now())
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        report = _get_or_404(_visible_reports(request.user), pk)
        serializer = ReportSerializer(report)
        return Response(serializer.data)
    
    @action(detail=False, url_path='last', url_name='last')
    def retrieve_last(self, request):
        receipt = utils.get_last_report()
        if (receipt == None):
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(receipt)
    
    def update(self, request, pk=None):
        report = _get_or_404(Report.objects.all(), pk)
        serializer = ReportResponseSerializer(report, data=request.data)
        serializer.is_valid(raise_exception=True)
        #* Nov odgovor korisnik još nije video
        serializer.save(seen=False)
        return Response(ReportSerializer(report).data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['put'], url_path='set-seen', url_name='set_seen')
    def set_seen(self, request, pk=None):
        report = _get_or_404(request.user.report_set, pk)
        report.seen = True
        report.save(update_fields=['seen'])
        serializer = ReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def destroy(self, request, pk=None):
        report = _get_or_404(_visible_reports(request.user), pk)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
