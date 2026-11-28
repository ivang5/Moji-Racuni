"""
Grafikoni statistike za PDF izveštaj (GET /api/receipts/plot/).

Grafikoni se crtaju objektnim API-jem (matplotlib.figure.Figure, bez pyplot-a): nema globalnog
stanja figura ni GUI backend-a, a slike se čuvaju u memoriji (BytesIO), ne na disku, pa se
zahtevi različitih korisnika ne mešaju. Matplotlib ipak nije garantovano thread-safe (dele se keševi
fontova i teksta), pa se crtanje dodatno izvršava pod lock-om.
"""
import base64
import threading
from io import BytesIO

from matplotlib.figure import Figure
from matplotlib.gridspec import GridSpec
from matplotlib.patches import Circle
from matplotlib.ticker import FuncFormatter

from moji_racuni_be import utils

BAR_COLOR = "#23c363"
HATCH_COLOR = "#0cb44f"
GRID_COLOR = "#dddddd"
PIE_COLORS = ["#8dd3c7", "#bebada", "#fb8072", "#80b1d3", "#fdb462"]
PIE_WEDGE_PROPS = {"linewidth": 2, "edgecolor": "white", "linestyle": "solid", "antialiased": True}
DPI = 400

_RENDER_LOCK = threading.Lock()


def _short_number(x, pos):
    if abs(x) >= 1e6:
        return f'{x / 1e6:.0f}M'
    elif abs(x) >= 1e3:
        return f'{x / 1e3:.0f}k'
    else:
        return f'{x:.0f}'


def _to_base64_png(fig):
    buffer = BytesIO()
    fig.savefig(buffer, format="png", bbox_inches="tight", dpi=DPI)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _add_horizontal_grid(fig):
    for ax in fig.get_axes():
        ax.tick_params(axis="both", which="both", labelsize=7)
        for tick in ax.get_yticks():
            ax.axhline(tick, color=GRID_COLOR, linestyle="-", linewidth=0.5, zorder=1)


def _time_bars_figure(weekdays, months, hours, weekday_values, month_values, hour_values, hatch, hatch_linewidth, short_numbers):
    """Tri bar grafikona: po danima, po mesecima (gore) i po satima (dole)."""
    fig = Figure(figsize=(10, 8))
    gs = GridSpec(2, 5, figure=fig, height_ratios=[3, 4])
    bar_style = {"hatch": hatch, "hatchcolor": HATCH_COLOR, "hatch_linewidth": hatch_linewidth, "color": BAR_COLOR, "zorder": 2}
    panels = [
        (gs[0, 0:2], weekdays, weekday_values, "Po danima"),
        (gs[0, 2:], months, month_values, "Po mesecima"),
        (gs[1, :], hours, hour_values, "Po satima"),
    ]
    for position, labels, values, title in panels:
        ax = fig.add_subplot(position)
        ax.bar(labels, values, **bar_style)
        if short_numbers:
            ax.yaxis.set_major_formatter(FuncFormatter(_short_number))
        ax.set_title(title, fontsize=14)
    ax.set_xlim(-0.5, len(hours) - 0.5)
    _add_horizontal_grid(fig)
    fig.subplots_adjust(wspace=0.4, hspace=0.3)
    return fig


def _donut(ax, values, labels, title):
    ax.set_title(title, fontsize=13, y=0.92)
    #* Bez podataka (npr. ADMIN nema svoje tipove preduzeća) pie ne može da se nacrta (zbir 0)
    if not values or sum(values) == 0:
        ax.text(0.5, 0.5, "Nema podataka", ha="center", va="center", fontsize=10, color="#777777", transform=ax.transAxes)
        ax.set_axis_off()
        return

    total = float(sum(values))

    def absolute_value(percent):
        return utils.format_chart_val(str(round(percent / 100. * total)))

    ax.pie(x=values, autopct=absolute_value, textprops={'fontsize': 7}, pctdistance=0.8, wedgeprops=PIE_WEDGE_PROPS, colors=PIE_COLORS, startangle=90)
    ax.legend(labels=labels, loc='lower center', bbox_to_anchor=(0.3, -0.18, 0.5, 1), prop={'size': 8}, frameon=False)
    ax.add_artist(Circle(xy=(0, 0), radius=.4, facecolor='white'))


def _donuts_figure(spent_values, spent_labels, visited_values, visited_labels, visited_title):
    fig = Figure(figsize=(10, 6))
    gs = GridSpec(1, 4, figure=fig)
    _donut(fig.add_subplot(gs[0, 0:2]), spent_values, spent_labels, 'Najveći troškovi')
    _donut(fig.add_subplot(gs[0, 2:]), visited_values, visited_labels, visited_title)
    fig.subplots_adjust(wspace=0.01, hspace=0.3)
    return fig


def _items_figure(item_labels, item_values):
    fig = Figure(figsize=(10, 8))
    gs = GridSpec(3, 1, figure=fig)
    ax = fig.add_subplot(gs[0:2, :])
    ax.bar(item_labels, item_values, hatch="..", hatchcolor=HATCH_COLOR, hatch_linewidth=2, color=BAR_COLOR, zorder=2)
    ax.yaxis.set_major_formatter(FuncFormatter(_short_number))
    ax.set_title("Najskuplje", fontsize=14)
    _add_horizontal_grid(fig)
    for label in ax.get_xticklabels():
        label.set(rotation=-45, ha="left", rotation_mode="anchor")
    fig.subplots_adjust(wspace=0.4, hspace=0.3)
    return fig


def build_statistics_plots(user, dateFrom, dateTo):
    """Vraća {"receipts", "spending", "companies", "types", "items"}: PNG slike kodirane u base64."""
    receipts_by_hour = utils.get_receipts_sum_by_hours(user, dateFrom, dateTo)
    money_spent_by_hour = utils.get_money_spent_by_hours(user, dateFrom, dateTo)
    hours, hr_counts, hr_spent = utils.get_receipts_hours_info(receipts_by_hour, money_spent_by_hour)
    receipts_by_weekday = utils.get_receipts_sum_by_weekdays(user, dateFrom, dateTo)
    money_spent_by_weekday = utils.get_money_spent_by_weekdays(user, dateFrom, dateTo)
    weekdays, wd_counts, wd_spent = utils.get_receipts_weekdays_info(receipts_by_weekday, money_spent_by_weekday)
    receipts_by_month = utils.get_receipts_sum_by_months(user, dateFrom, dateTo)
    money_spent_by_month = utils.get_money_spent_by_months(user, dateFrom, dateTo)
    months, mo_counts, mo_spent = utils.get_receipts_months_info(receipts_by_month, money_spent_by_month)

    most_spent_companies = utils.get_most_spent_companies(user, dateFrom, dateTo, 5)
    msc_labels, msc_values = utils.get_objects_info(most_spent_companies, "companyName", "priceSum")
    most_spent_types = utils.get_most_spent_types(user, dateFrom, dateTo, 5)
    mst_labels, mst_values = utils.get_objects_info(most_spent_types, "companyType", "priceSum")
    most_visited_companies = utils.get_most_visited_companies(user, dateFrom, dateTo, 5)
    mvc_labels, mvc_values = utils.get_objects_info(most_visited_companies, "companyName", "receiptCount")
    most_visited_types = utils.get_most_visited_types(user, dateFrom, dateTo, 5)
    mvt_labels, mvt_values = utils.get_objects_info(most_visited_types, "companyType", "receiptCount")

    most_valuable_items = utils.get_most_valuable_items(user, dateFrom, dateTo, 10)
    item_labels, item_values = utils.get_most_valuable_items_info(most_valuable_items)

    figures = {
        "receipts": lambda: _time_bars_figure(
            weekdays, months, hours, wd_counts, mo_counts, hr_counts, hatch="//", hatch_linewidth=4, short_numbers=False
        ),
        "spending": lambda: _time_bars_figure(
            weekdays, months, hours, wd_spent, mo_spent, hr_spent, hatch="..", hatch_linewidth=2, short_numbers=True
        ),
        "companies": lambda: _donuts_figure(msc_values, msc_labels, mvc_values, mvc_labels, 'Najposećenija'),
        "types": lambda: _donuts_figure(mst_values, mst_labels, mvt_values, mvt_labels, 'Najposećeniji'),
        "items": lambda: _items_figure(item_labels, item_values),
    }
    with _RENDER_LOCK:
        return {name: _to_base64_png(make_figure()) for name, make_figure in figures.items()}
