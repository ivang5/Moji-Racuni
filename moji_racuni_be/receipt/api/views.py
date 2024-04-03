from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework import viewsets
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import get_object_or_404
from .serializers import ReceiptSerializer, ItemSerializer, ReportSerializer
from receipt.models import Receipt, Item, Report
from moji_racuni_be import utils
import matplotlib as mpl
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import base64


@permission_classes([IsAuthenticated])
class ReceiptViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if (user.role == "ADMIN"):
            receipts = utils.get_distinct_receipts()
        else:
            receipts = user.receipt_set.all()
        p = Paginator(receipts, 12)
        try:
            page = p.page(self.request.query_params.get('page'))
        except (EmptyPage, PageNotAnInteger):
            page = p.page(1)
        if (user.role == "ADMIN"):
            res = {
                "pageCount": p.num_pages,
                "pageNum": page.number,
                "receipts": receipts
            }
        else:
            serializer = ReceiptSerializer(page, many=True)
            res = {
                "pageCount": p.num_pages,
                "pageNum": page.number,
                "receipts": serializer.data
            }
        return Response(res)
    
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
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        limit = self.request.query_params.get('limit')
        if (not dateFrom or not dateTo or not limit):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        receipts_by_hour = utils.get_receipts_sum_by_hours(user, dateFrom, dateTo)
        hours, hr_counts = utils.get_receipts_hours_info(receipts_by_hour)
        receipts_by_weekday = utils.get_receipts_sum_by_weekdays(user, dateFrom, dateTo)
        weekdays, wd_counts = utils.get_receipts_weekdays_info(receipts_by_weekday)
        receipts_by_month = utils.get_receipts_sum_by_months(user, dateFrom, dateTo)
        months, mo_counts = utils.get_receipts_months_info(receipts_by_month)

        mpl.rcParams["hatch.color"] = "#0cb44f"
        mpl.rcParams["hatch.linewidth"] = 4
        fig = plt.figure(figsize=(10, 8))
        gs = gridspec.GridSpec(2, 5, height_ratios=[3, 4])
        ax1 = fig.add_subplot(gs[0, 0:2])
        ax1.bar(weekdays, wd_counts, hatch="//", color="#23c363", zorder=2)
        ax1.set_title("Po danima", fontsize=14)
        ax2 = fig.add_subplot(gs[0, 2:])
        ax2.bar(months, mo_counts, hatch="//", color="#23c363", zorder=2)
        ax2.set_title("Po mesecima", fontsize=14)
        ax3 = fig.add_subplot(gs[1, :])
        ax3.bar(hours, hr_counts, hatch="//", color="#23c363", zorder=2)
        ax3.set_title("Po satima", fontsize=14)
        ax3.set_xlim(-0.5, len(hours) - 0.5)
        for ax in fig.get_axes():
            ax.tick_params(axis="both", which="both", labelsize=7)
            for tick in ax.get_yticks():
                ax.axhline(tick, color="#dddddd", linestyle="-", linewidth=0.5, zorder=1)
        plt.subplots_adjust(hspace=0.3)
        fig.savefig("./receipts_stat.png", bbox_inches="tight", dpi=200)
        
        plot = {}
        
        with open("./receipts_stat.png", "rb") as img_file:
            plot["receipts"] = base64.b64encode(img_file.read()).decode('utf-8')
        return Response(plot)

    def create(self, request):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        receipts = user.receipt_set.all()
        receipt_link = request.data.get('url')
        for receipt in receipts:
            if (receipt.link == receipt_link):
                return Response(status=status.HTTP_409_CONFLICT)
        receipt = utils.retrieve_receipt(request.data.get('url'), request.data.get('companyUnit'), user.id)
        serializer = ReceiptSerializer(data=receipt)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = Receipt.objects.all()
        receipt = get_object_or_404(queryset, pk=pk)
        user = request.user
        if (receipt.user != user and user.role != "ADMIN"):
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ReceiptSerializer(receipt)
        return Response(serializer.data)
    
    @action(detail=False, url_path='last', url_name='last')
    def retrieve_last(self, request):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        receipt = utils.get_last_receipt(user)
        if (receipt == None):
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(receipt)

    def destroy(self, request, pk=None):
        receipt = get_object_or_404(Receipt, pk=pk)
        user = request.user
        if (receipt.user != user):
            return Response(status=status.HTTP_404_NOT_FOUND)
        receipt.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@permission_classes([IsAuthenticated])
class ItemViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if (user.role != "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        items = Item.objects.all()
        serializer = ItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, url_path='receipt', url_name='receipt')
    def all(self, request, pk=None):
        queryset = Receipt.objects.all()
        receipt = get_object_or_404(queryset, pk=pk)
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
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        items = utils.retrieve_items(request.data.get('url'), request.data.get('receipt'))
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

    def retrieve(self, request, pk=None):
        queryset = Item.objects.all()
        item = get_object_or_404(queryset, pk=pk)
        serializer = ItemSerializer(item)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        item = get_object_or_404(Item, pk=pk)
        serializer = ItemSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        item = get_object_or_404(Item, pk=pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@permission_classes([IsAuthenticated])
class ReportViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if (user.role == "ADMIN"):
            reports = Report.objects.all()
        else:
            reports = user.report_set.all()
        p = Paginator(reports, 12)
        try:
            page = p.page(self.request.query_params.get('page'))
        except (EmptyPage, PageNotAnInteger):
            page = p.page(1)
        serializer = ReportSerializer(page, many=True)
        res = {
            "pageCount": p.num_pages,
            "pageNum": page.number,
            "reports": serializer.data
        }
        return Response(res)
    
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
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        req_data = request.data
        req_data["user"] = user.id
        serializer = ReportSerializer(data=req_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = Report.objects.all()
        report = get_object_or_404(queryset, pk=pk)
        serializer = ReportSerializer(report)
        return Response(serializer.data)
    
    @action(detail=False, url_path='last', url_name='last')
    def retrieve_last(self, request):
        user = request.user
        if (user.role != "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        receipt = utils.get_last_report()
        if (receipt == None):
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(receipt)
    
    def update(self, request, pk=None):
        report = get_object_or_404(Report, pk=pk)
        serializer = ReportSerializer(report, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'], url_path='set-seen', url_name='set_seen')
    def set_seen(self, request, pk=None):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        report_queryset = Report.objects.all()
        report = get_object_or_404(report_queryset, pk=pk)
        report.seen = True
        report.save()
        serializer = ReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def destroy(self, request, pk=None):
        user = request.user
        report = get_object_or_404(Report, pk=pk)
        if (user.role != "ADMIN"):
            reports = user.report_set.all()
            found = False
            for rep in reports:
                if (rep.id == int(pk)):
                    found = True
                    break
            if (not found):
                return Response(status=status.HTTP_401_UNAUTHORIZED)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)