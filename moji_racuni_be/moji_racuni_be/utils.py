from bs4 import BeautifulSoup
import requests
from srtools import cyrillic_to_latin
from django.db import connection

# ==========================================================
#                        WEB-SCRAPING
# ==========================================================

def remove_line_breaks(receipt):
    """ 
    Brise sve nepotrebne line break-ove u sekciji racuna sa stavkama.
    Ovo garantuje da će čitavi nazivi stavki biti u samo jednom redu,
    isto važi i za jedinicu mere.
    """
    new_receipt = receipt
    finding = True
    start = 0
    
    while finding:
        index = new_receipt[start:].find('\r\n')
        if index != -1:
            #* Ako nakon '\r\n' postoji 3 whitespace-a, povećati početni index i tražiti dalje
            if new_receipt[index + start + 2:index + start + 5] == "   ":
                start = index + start + 2
            #* Ako nakon '\r\n' ne postoji 3 whitespace-a, proveriti da li ispred '\r\n' postoji broj (cena)
            else:
                #* Ako ispred '\r\n' postoji broj (cena), povećati početni index i tražiti dalje
                try:
                    int(new_receipt[index + start - 1])
                    start = index + start + 2
                #* Ako ispred '\r\n' ne postoji broj, obrisati '\r\n' i tražiti dalje
                except ValueError:
                    new_receipt = new_receipt[:index + start ] + new_receipt[index + start + 2:]
        else:
            finding = False
    return new_receipt

def remove_item_code(name):
    """
    Proverava da li ispred ili iza naziva stavke postoji šifra stavke
    i briše je ukoliko postoji.
    """
    name_parts_space = name.split(' ')
    name_parts_dash = name.split("-")
    name_parts_comma = name.split(',')
    if (len(name.rstrip()) == len(name_parts_space[0])):
        return name
    #* Traženje šifre ispred naziva
    try:
        int(name_parts_space[0])
        new_name = name.split(' ', 1)[1]
        
        #* Ukoliko između šifre i naziva stavke postoji povlaka, i nju treba ukloniti
        if (name_parts_space[1] == '-'):
            new_name = new_name.split(' ', 1)[1]
        return new_name
    except ValueError:
        try:
            #* U nekim slučajevima šifra počinje sa slovom, a nastavlja brojevima, ovde se to proverava
            int(name_parts_space[0][1:])
            if (name_parts_space[0][0] != '('):
                new_name = name.split(' ', 1)[1]
                return new_name
        except ValueError:
            #* Ponekad su šifra i naziv podeljeni samo povlakom, bez razmaka, taj slučaj se ovde rešava
            try:
                int(name_parts_dash[0])
                new_name = name.split('-', 1)[1]
                return new_name
            except ValueError:
                #* Ponekad su šifra i naziv podeljeni samo zarezom, bez razmaka, taj slučaj se ovde rešava
                try:
                    int(name_parts_comma[0])
                    new_name = name.split(',', 1)[1]
                    return new_name
                except ValueError:
                    pass
    
    #* Traženje šifre iza naziva         
    try:
        int(name_parts_space[-1])
        
        #* Kada tražimo šifru iza naziva moramo uzeti u obzir da se ponekad u sklopu naziva mogu pronaći brojevi,
        #* ukoliko postoji više od 4 broja, možemo biti prilično sigurni da je u pitanju šifra
        if (len(name_parts_space[-1]) > 4):
            new_name = name.rsplit(' ', 1)[0]
            
            #* Ukoliko između šifre i naziva stavke postoji povlaka, i nju treba ukloniti
            if (name_parts_space[-2] == '-'):
                new_name = new_name.rsplit(' ', 1)[0]
            return new_name
    except ValueError:
        #* Ponekad su šifra i naziv podeljeni samo povlakom, bez razmaka, taj slučaj se ovde rešava
        try:
            int(name_parts_dash[-1])
            
            if (len(name_parts_dash[-1]) > 4):
                new_name = name.rsplit('-', 1)[0]
                return new_name
        except ValueError:
            #* Ponekad su šifra i naziv podeljeni samo zarezom, bez razmaka, taj slučaj se ovde rešava
            try:
                int(name_parts_comma[-1])
                
                if (len(name_parts_comma[-1]) > 4):
                    new_name = name.rsplit(',', 1)[0]
                    return new_name
            except ValueError:
                return name
    return name

def get_vat(item_part):
    """
    Pronalazi tip PDV-a i beleži ga, a zatim zasebno vraća item_part i tip PDV-a 
    """
    new_part = item_part
    
    if (item_part.find("(e)") != -1):
        vat = ("10")
        new_part = new_part.replace("(e)", "")
    elif (item_part.find("(a)") != -1 or item_part.find("(g)") != -1):
        vat = ("0")
        new_part = new_part.replace("(a)", "")
        new_part = new_part.replace("(g)", "")
    else:
        vat = ("20")
        new_part = new_part.replace("(đ)", "")
    return {"new_part": new_part, "vat": vat}

def remove_replacement_char(item_part):
    return item_part.replace(u"\ufffd", "")

def get_name(item_part, measure_type, measure_prefix):
    """
    Vraća naziv stavke bez merne jedinice i šifre
    """
    item = item_part.split(f' {measure_prefix}{measure_type}')[0]
    
    #* Ako su item i item_part i dalje isti nismo dobro razdvojili naziv od merne jedinice
    #* U tom slučaju opet pokušavamo to da uradimo dodavanjem razmaka između prefiksa i merne jedinice
    if (item == item_part):
        item = item_part.split(f' {measure_prefix} {measure_type}')[0]
    
    #* Ukoliko su i dalje isti, pokušavamo da skinemo mernu jedinicu bez prefiksa
    if (item == item_part):
        item = item_part.split(f' {measure_type}')[0]
    
    #* Ukoliko se oznaka PDV-a otvara na kraju reda, zagrada ce biti obrisana
    if (item[-1] == "("):
        item = item[:-1]
    
    #* Uklanjanje whitespace-a sa početka i kraja string-a
    item = item.strip()
    
    if (item.endswith(measure_prefix + measure_type)):
        item = item.replace(measure_prefix + measure_type, '')
    
    item_no_code = remove_item_code(item)
    return item_no_code

def get_measure_type(item_part, measure_prefix):
    """
    Vraća mernu jedinicu stavke
    """
    if (item_part.find(measure_prefix + "kom") != -1 or
        item_part.find(measure_prefix + " kom") != -1):
        return "kom"
    elif (item_part.find(measure_prefix + "kg") != -1 or
          item_part.find(measure_prefix + " kg") != -1):
        return "kg"
    elif (item_part.find(measure_prefix + "l") != -1 or
          item_part.find(measure_prefix + " l") != -1 or
          item_part.find(measure_prefix + "lit") != -1 or
          item_part.find(measure_prefix + " lit") != -1):
        return "l"
    elif (item_part.find(measure_prefix + "kut") != -1 or
          item_part.find(measure_prefix + " kut") != -1):
        return "kut"
    elif (item_part.find(measure_prefix + "pce") != -1 or
        item_part.find(measure_prefix + " pce") != -1):
        return "pce"
    elif (item_part.find(measure_prefix + "m") != -1 or
        item_part.find(measure_prefix + " m") != -1):
        return "m"
    else:
        if (measure_prefix == "{"):
            if (item_part.strip().endswith(" kom")):
                return "kom"
            elif (item_part.strip().endswith(" kg")):
                return "kg"
            elif (item_part.strip().endswith(" kut")):
                return "kut"
    return "unknown"

def get_measure_prefix(item_part):
    """
    Vraća prefiks merne jedinice
    """
    item_part_end = item_part.rstrip()[-6:]
    if (item_part_end.find("[") != -1 and item_part_end.find("]") != -1):
        return "["
    elif (item_part_end.find("(") != -1 and item_part_end.find(")") != -1):
        return "("
    elif (item_part_end.find("/") != -1):
        return "/"
    else:
        return "{"
    
def get_company_unit(info_groups, company_tin):
    """
    Izvlači informacije o prodajnom mestu iz prvog info panela i zatim ga kreira
    """
    name = cyrillic_to_latin(info_groups[1].text.strip().title())
    address = cyrillic_to_latin(info_groups[2].text.strip().title())
    place = cyrillic_to_latin(info_groups[3].text.strip().title())
    municipality = cyrillic_to_latin(info_groups[4].text.strip().title())
    category = cyrillic_to_latin(info_groups[7].text.strip())
    company_unit = {
        "name" : name, 
        "address": address, 
        "place": place, 
        "municipality": municipality, 
        "category": category, 
        "company": company_tin
    }
    return company_unit

def get_receipt(url, info_groups, total_vat, company_unit_id, user_id):
    """
    Izvlači ukupan iznos i vreme iz drugog info panela i kreira račun.
    """
    date = info_groups[6].text.strip()
    time = date.split(" ")[1]
    day = date.split(".")[0]
    month = date.split(".")[1]
    year = date.split(".")[2]
    formatted_date = (f"{year}-{month}-{day} {time}")
    total_price = float(info_groups[0].text.strip().replace('.', '').replace(",", "."))
    receipt = {
        "date": formatted_date, 
        "link": url, 
        "user": user_id,
        "companyUnit": company_unit_id,
        "totalPrice": total_price, 
        "totalVat": total_vat
    }
    return receipt

def get_items(receipt, receipt_id):
    """
    Prolazi kroz telo računa i izvlači stavke.
    """
    items_receipt_initial = receipt.split('========================================')[1].split('----------------------------------------')[0].split('Укупно')[1]
    items_receipt = remove_line_breaks(items_receipt_initial).split('\r\n')
    items = []
    item_names = []
    item_measures = []
    item_vats = []
    item_prices = []
    item_quantities = []
    to_analyze = "name_measure"
    
    for i, item_part in enumerate(items_receipt):
        if i == len(items_receipt) - 1:
            continue
        elif to_analyze == "name_measure":
            item_part_lower = item_part.lower()
            item_part_latin = cyrillic_to_latin(item_part_lower)
            item_part_filtered = get_vat(item_part_latin)
            item_vats.append(item_part_filtered["vat"])
            item_part_normalized = remove_replacement_char(item_part_filtered["new_part"])
            
            measure_prefix = get_measure_prefix(item_part_normalized)
            measure_type = get_measure_type(item_part_normalized, measure_prefix)
            item_measures.append(measure_type)

            item_name = get_name(item_part_normalized, measure_type, measure_prefix)
            item_names.append(item_name)

            to_analyze = "price_quantity"
        else:
            position = 0
            successful = False

            while not successful:
                try:
                    item_price = float(" ".join(item_part.replace('.', '').split()).split(' ')[position].replace(",", "."))
                    item_quantity = float(" ".join(item_part.replace('.', '').split()).split(' ')[position + 1].replace(",", "."))
                    item_prices.append(item_price)
                    item_quantities.append(item_quantity)
                    successful = True
                except ValueError:
                    test = " ".join(item_part.replace('.', '').split()).split(' ')[position].replace(",", ".")
                    position += 1
                except IndexError:
                    break
            
            if successful:
                to_analyze = "name_measure"
                
    for i in range(0, len(item_names)):
        item = {
            "name": item_names[i], 
            "measurementUnit": item_measures[i], 
            "vatType": item_vats[i], 
            "price": item_prices[i], 
            "quantity": item_quantities[i],
            "receipt": receipt_id
        }
        items.append(item)
    
    for item in items:
        item["measurementUnit"] = item["measurementUnit"].upper()
        if (item["measurementUnit"] == "PCE"):
            item["measurementUnit"] = "KOM"
        elif (item["measurementUnit"] == "UNKNOWN"):
            if (item["quantity"] % 1 == 0):
                item["measurementUnit"] = "KOM"
            else:
                item["measurementUnit"] = "KG"
    return items
    

def retrieve_company(url):
    html_text = requests.get(url).text
    soup = BeautifulSoup(html_text, 'lxml')
    
    try:
        receipt = soup.find('pre').text
    except AttributeError:
        return False
    
    company = {
        "tin": int(receipt.split('\r\n')[1]),
        "name": cyrillic_to_latin(receipt.split('\r\n')[2].title()),
    }
    return company
    
def retrieve_company_unit(url, company_tin):
    html_text = requests.get(url).text
    soup = BeautifulSoup(html_text, 'lxml')
    info_panels = soup.find_all('div', class_='panel-info')
    info_groups_first = info_panels[0].select('.panel-body .form-group div')
    company_unit = get_company_unit(info_groups_first, company_tin)
    return company_unit

def retrieve_receipt(url, company_unit_id, user_id):
    html_text = requests.get(url).text
    soup = BeautifulSoup(html_text, 'lxml')
    info_panels = soup.find_all('div', class_='panel-info')
    info_groups_second = info_panels[1].select('.panel-body .form-group div')
    
    try:
        receipt = soup.find('pre').text
    except AttributeError:
        return False
    
    total_vat_str = receipt.split('Укупан износ пореза:')[1].split('\r\n')[0].strip()
    total_vat = float(total_vat_str.replace('.', '').replace(",", "."))
    receipt_obj = get_receipt(url, info_groups_second, total_vat, company_unit_id, user_id)
    return receipt_obj
    
def retrieve_items(url, receipt_id):
    html_text = requests.get(url).text
    soup = BeautifulSoup(html_text, 'lxml')
    
    try:
        receipt = soup.find('pre').text
    except AttributeError:
        return False
    
    items = get_items(receipt, receipt_id)
    return items



# ==========================================================
#                  CUSTOM DATABASE QUERIES
# ==========================================================

def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]
    
def fill_empty_hours(hours_list, type):
    new_hours_list = hours_list
    for i in range(24):
        found = False
        for hour in hours_list:
            if i == hour["hourNum"]:
                found = True
                break
        if not found:
            if type == "count":
                new_hour_info = {"hourNum": i, "count": 0}
            elif type == "spent":
                new_hour_info = {"hourNum": i, "spent": 0}
            new_hours_list.append(new_hour_info)
    sorted_list = sorted(new_hours_list, key=lambda d: d['hourNum'])
    sorted_list.append(sorted_list.pop(0))
    return sorted_list

def fill_empty_weekdays(weekdays_list, type):
    new_weekdays_list = weekdays_list
    for i in range(1, 8):
        found = False
        for weekday in weekdays_list:
            if i == weekday["dayofweek"]:
                found = True
                break
        if not found:
            if type == "count":
                new_weekday_info = {"dayofweek": i, "count": 0}
            elif type == "spent":
                new_weekday_info = {"dayofweek": i, "spent": 0}
            new_weekdays_list.append(new_weekday_info)
    sorted_list = sorted(new_weekdays_list, key=lambda d: d['dayofweek'])
    return sorted_list
    
def fill_empty_months(months_list, type):
    new_months_list = months_list
    for i in range(1, 13):
        found = False
        for month in months_list:
            if i == month["monthNum"]:
                found = True
                break
        if not found:
            if type == "count":
                new_month_info = {"monthNum": i, "count": 0}
            elif type == "spent":
                new_month_info = {"monthNum": i, "spent": 0}
            new_months_list.append(new_month_info)
    sorted_list = sorted(new_months_list, key=lambda d: d['monthNum'])
    return sorted_list
    
def get_distinct_receipts():
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM receipt_receipt GROUP BY link")
        receipts = dictfetchall(cursor)
    return receipts
    
def get_last_receipt(user):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM receipt_receipt WHERE user = %s ORDER BY date DESC LIMIT 1", [user.id])
        row = cursor.fetchone()
        
    if (row == None):
        return row
    
    receipt = {
        "id": row[0],
        "date": row[1], 
        "link": row[2], 
        "companyUnit": row[3],
        "user": row[4], 
        "totalPrice": row[5], 
        "totalVat": row[6]
    }
    return receipt

def get_last_report():
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM receipt_report WHERE date = (SELECT MAX(date) FROM receipt_report)")
        row = cursor.fetchone()
        
    if (row == None):
        return row
    
    receipt = {
        "id": row[0],
        "date": row[1], 
        "request": row[2], 
        "response": row[3],
        "closed": row[4], 
        "seen": row[5], 
        "receipt": row[6],
        "user": row[7]
    }
    return receipt

def get_total_spent(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT SUM(totalPrice), SUM(totalVat), count(*), max(totalPrice), avg(totalPrice) 
                    FROM (SELECT * FROM receipt_receipt GROUP BY link) r
                    WHERE r.date BETWEEN %s AND %s
                ''', 
                [dateFrom, dateTo])
            row = cursor.fetchone()
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT SUM(totalPrice), SUM(totalVat), count(*), max(totalPrice), avg(totalPrice) 
                    FROM receipt_receipt
                    WHERE user = %s AND date BETWEEN %s AND %s
                ''', 
                [user.id, dateFrom, dateTo])
            row = cursor.fetchone()
            
    total_spent_info = {
        "totalSpent": row[0],
        "totalSpentVat": row[1],
        "receiptsCount": row[2],
        "mostSpentReceipt": row[3],
        "avgSpentReceipt": row[4],
    }
    return total_spent_info

def get_receipts_sum_by_hours(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT HOUR(date) hourNum, count(*) count
                    FROM (SELECT * FROM receipt_receipt GROUP BY link) r
                    WHERE r.date BETWEEN %s AND %s
                    GROUP BY HOUR(r.date)
                ''',
                [dateFrom, dateTo])
            receipts_by_hours = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT HOUR(date) hourNum, count(*) count
                    FROM receipt_receipt
                    WHERE user = %s AND date BETWEEN %s AND %s
                    GROUP BY HOUR(date)
                ''',
                [user.id, dateFrom, dateTo])
            receipts_by_hours = dictfetchall(cursor)
    receipts_by_hours = fill_empty_hours(receipts_by_hours, "count")
    return receipts_by_hours

def get_receipts_sum_by_weekdays(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT (DAYOFWEEK(date)+5)%%7+1 dayofweek, count(*) count 
                    FROM (SELECT * FROM receipt_receipt GROUP BY link) r 
                    WHERE r.date BETWEEN %s AND %s 
                    GROUP BY (DAYOFWEEK(r.date)+5)%%7+1
                ''',
                [dateFrom, dateTo])
            receipts_by_weekdays = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT (DAYOFWEEK(date)+5)%%7+1 dayofweek, count(*) count 
                    FROM receipt_receipt 
                    WHERE user = %s AND date BETWEEN %s AND %s 
                    GROUP BY (DAYOFWEEK(date)+5)%%7+1
                ''',
                [user.id, dateFrom, dateTo])
            receipts_by_weekdays = dictfetchall(cursor)
    receipts_by_weekdays = fill_empty_weekdays(receipts_by_weekdays, "count")
    return receipts_by_weekdays

def get_receipts_sum_by_months(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT MONTH(date) monthNum, count(*) count 
                    FROM (SELECT * FROM receipt_receipt GROUP BY link) r 
                    WHERE r.date BETWEEN %s AND %s 
                    GROUP BY MONTH(r.date)
                ''',
                [dateFrom, dateTo])
            receipts_by_months = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT MONTH(date) monthNum, count(*) count 
                    FROM receipt_receipt 
                    WHERE user = %s AND date BETWEEN %s AND %s 
                    GROUP BY MONTH(date)
                ''',
                [user.id, dateFrom, dateTo])
            receipts_by_months = dictfetchall(cursor)
    receipts_by_months = fill_empty_months(receipts_by_months, "count")
    return receipts_by_months

def get_money_spent_by_hours(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT HOUR(date) hourNum, sum(r.totalPrice) spent
                    FROM (SELECT * FROM receipt_receipt GROUP BY link) r
                    WHERE r.date BETWEEN %s AND %s
                    GROUP BY HOUR(r.date)
                ''',
                [dateFrom, dateTo])
            spent_by_hours = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT HOUR(date) hourNum, sum(totalPrice) spent
                    FROM receipt_receipt
                    WHERE user = %s AND date BETWEEN %s AND %s
                    GROUP BY HOUR(date)
                ''',
                [user.id, dateFrom, dateTo])
            spent_by_hours = dictfetchall(cursor)
    spent_by_hours = fill_empty_hours(spent_by_hours, "spent")
    return spent_by_hours

def get_money_spent_by_weekdays(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT (DAYOFWEEK(date)+5)%%7+1 dayofweek, sum(r.totalPrice) spent 
                    FROM (SELECT * FROM receipt_receipt GROUP BY link) r 
                    WHERE r.date BETWEEN %s AND %s 
                    GROUP BY (DAYOFWEEK(r.date)+5)%%7+1
                ''',
                [dateFrom, dateTo])
            receipts_by_weekdays = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT (DAYOFWEEK(date)+5)%%7+1 dayofweek, sum(totalPrice) spent 
                    FROM receipt_receipt 
                    WHERE user = %s AND date BETWEEN %s AND %s 
                    GROUP BY (DAYOFWEEK(date)+5)%%7+1
                ''',
                [user.id, dateFrom, dateTo])
            receipts_by_weekdays = dictfetchall(cursor)
    receipts_by_weekdays = fill_empty_weekdays(receipts_by_weekdays, "spent")
    return receipts_by_weekdays

def get_money_spent_by_months(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT MONTH(date) monthNum, sum(r.totalPrice) spent 
                    FROM (SELECT * FROM receipt_receipt GROUP BY link) r 
                    WHERE r.date BETWEEN %s AND %s 
                    GROUP BY MONTH(r.date)
                ''',
                [dateFrom, dateTo])
            receipts_by_months = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT MONTH(date) monthNum, sum(totalPrice) spent 
                    FROM receipt_receipt 
                    WHERE user = %s AND date BETWEEN %s AND %s 
                    GROUP BY MONTH(date)
                ''',
                [user.id, dateFrom, dateTo])
            receipts_by_months = dictfetchall(cursor)
    receipts_by_months = fill_empty_months(receipts_by_months, "spent")
    return receipts_by_months

def get_most_spent_in_a_day(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT max(innerQuery.sumPrice) FROM (
                    SELECT sum(r.totalPrice) sumPrice, r.date foundDate FROM (
                        SELECT * FROM receipt_receipt r GROUP BY link
                        ) r
                        WHERE r.date BETWEEN %s AND %s
                        GROUP BY CAST(r.date AS DATE)
                    ) innerQuery
                ''', 
                [dateFrom, dateTo])
            row = cursor.fetchone()
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT max(innerQuery.sumPrice) FROM (
                    SELECT sum(r.totalPrice) sumPrice, r.date foundDate FROM (
                        SELECT * FROM receipt_receipt r GROUP BY link
                        ) r
                        WHERE r.user = %s AND r.date BETWEEN %s AND %s
                        GROUP BY CAST(r.date AS DATE)
                    ) innerQuery
                ''', 
                [user.id, dateFrom, dateTo])
            row = cursor.fetchone()
            
    most_spent_in_a_day = {
        "mostSpent": row[0],
    }
    return most_spent_in_a_day

def get_most_valuable_items(user, dateFrom, dateTo, limit):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT i.* FROM receipt_item i 
                    JOIN (SELECT * FROM receipt_receipt GROUP BY link) r ON i.receipt = r.id 
                    WHERE r.date BETWEEN %s AND %s 
                    GROUP BY i.name 
                    ORDER BY price DESC 
                    LIMIT %s
                ''', 
                [dateFrom, dateTo, limit])
            items = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT i.* FROM receipt_item i 
                    JOIN receipt_receipt r ON i.receipt = r.id 
                    WHERE r.user = %s AND r.date BETWEEN %s AND %s 
                    GROUP BY i.name 
                    ORDER BY price DESC 
                    LIMIT %s
                ''', 
                [user.id, dateFrom, dateTo, limit])
            items = dictfetchall(cursor)
    return items

def get_most_items_on_receipt(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT MAX(innerQuery.itemsCount), AVG(innerQuery.itemsCount) 
                    FROM (
                        SELECT COUNT(*) AS itemsCount 
                            FROM receipt_item i 
                            JOIN receipt_receipt r ON i.receipt = r.id 
                            WHERE r.date BETWEEN %s AND %s
                            GROUP BY i.receipt
                        ) 
                    innerQuery
                ''', 
                [dateFrom, dateTo])
            row = cursor.fetchone()
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT MAX(innerQuery.itemsCount), AVG(innerQuery.itemsCount) 
                    FROM (
                        SELECT COUNT(*) AS itemsCount 
                            FROM receipt_item i 
                            JOIN receipt_receipt r ON i.receipt = r.id 
                            WHERE r.user = %s AND r.date BETWEEN %s AND %s
                            GROUP BY i.receipt
                        ) 
                    innerQuery
                ''', 
                [user.id, dateFrom, dateTo])
            row = cursor.fetchone()
            
    most_items = {
        "mostItems": row[0],
        "avgItems": row[1],
    }
    return most_items

def count_visited_companies(user, dateFrom, dateTo):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT COUNT(DISTINCT c.tin) AS companyCount, COUNT(DISTINCT u.id) AS unitCount
                    FROM company_company c
                    JOIN company_companyunit u ON c.tin = u.company
                    JOIN receipt_receipt r ON u.id = r.companyUnit
                    WHERE r.date BETWEEN %s AND %s
                ''', 
                [dateFrom, dateTo])
            row = cursor.fetchone()
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT COUNT(DISTINCT c.tin) AS companyCount, COUNT(DISTINCT u.id) AS unitCount
                    FROM company_company c
                    JOIN company_companyunit u ON c.tin = u.company
                    JOIN receipt_receipt r ON u.id = r.companyUnit
                    WHERE r.user = %s AND r.date BETWEEN %s AND %s
                ''', 
                [user.id, dateFrom, dateTo])
            row = cursor.fetchone()
            
    visited_info = {
        "companyCount": row[0],
        "unitCount": row[1]
    }
    return visited_info

def get_most_spent_companies(user, dateFrom, dateTo, limit):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT innerQuery.receiptCount AS receiptCount, innerQuery.priceSum, innerQuery.unitCount, innerQuery.companyTin, innerQuery.companyName FROM (
                    SELECT COUNT(r.id) AS receiptCount, SUM(r.totalPrice) AS priceSum, COUNT(DISTINCT u.id) AS unitCount, c.tin AS companyTin, c.name AS companyName
                        FROM (SELECT * FROM receipt_receipt GROUP BY link) r
                        JOIN company_companyunit u ON r.companyUnit = u.id
                        JOIN company_company c ON u.company = c.tin
                        WHERE r.date BETWEEN %s AND %s
                        GROUP BY c.tin
                ) innerQuery 
                    ORDER BY priceSum DESC, receiptCount DESC
                    LIMIT %s
                ''', 
                [dateFrom, dateTo, limit])
            most_spent_companies = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT innerQuery.receiptCount AS receiptCount, innerQuery.priceSum, innerQuery.unitCount, innerQuery.companyTin, innerQuery.companyName FROM (
                    SELECT COUNT(r.id) AS receiptCount, SUM(r.totalPrice) AS priceSum, COUNT(DISTINCT u.id) AS unitCount, c.tin AS companyTin, c.name AS companyName
                        FROM receipt_receipt r
                        JOIN company_companyunit u ON r.companyUnit = u.id
                        JOIN company_company c ON u.company = c.tin
                        WHERE r.user = %s AND r.date BETWEEN %s AND %s
                        GROUP BY c.tin
                ) innerQuery 
                    ORDER BY priceSum DESC, receiptCount DESC
                    LIMIT %s
                ''', 
                [user.id, dateFrom, dateTo, limit])
            most_spent_companies = dictfetchall(cursor)
    return most_spent_companies

def get_most_visited_companies(user, dateFrom, dateTo, limit):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT innerQuery.receiptCount AS receiptCount, innerQuery.priceSum, innerQuery.unitCount, innerQuery.companyTin, innerQuery.companyName FROM (
                    SELECT COUNT(r.id) AS receiptCount, SUM(r.totalPrice) AS priceSum, COUNT(DISTINCT u.id) AS unitCount, c.tin AS companyTin, c.name AS companyName
                        FROM (SELECT * FROM receipt_receipt GROUP BY link) r
                        JOIN company_companyunit u ON r.companyUnit = u.id
                        JOIN company_company c ON u.company = c.tin
                        WHERE r.date BETWEEN %s AND %s
                        GROUP BY c.tin
                ) innerQuery 
                    ORDER BY receiptCount DESC, priceSum DESC
                    LIMIT %s
                ''', 
                [dateFrom, dateTo, limit])
            most_visited_companies = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT innerQuery.receiptCount AS receiptCount, innerQuery.priceSum, innerQuery.unitCount, innerQuery.companyTin, innerQuery.companyName FROM (
                    SELECT COUNT(r.id) AS receiptCount, SUM(r.totalPrice) AS priceSum, COUNT(DISTINCT u.id) AS unitCount, c.tin AS companyTin, c.name AS companyName
                        FROM receipt_receipt r
                        JOIN company_companyunit u ON r.companyUnit = u.id
                        JOIN company_company c ON u.company = c.tin
                        WHERE r.user = %s AND r.date BETWEEN %s AND %s
                        GROUP BY c.tin
                ) innerQuery 
                    ORDER BY receiptCount DESC, priceSum DESC
                    LIMIT %s
                ''', 
                [user.id, dateFrom, dateTo, limit])
            most_visited_companies = dictfetchall(cursor)
    return most_visited_companies

def get_most_spent_types(user, dateFrom, dateTo, limit):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT innerQuery.companyType, innerQuery.receiptCount AS receiptCount, innerQuery.priceSum FROM (
                    SELECT t.name AS companyType, COUNT(r.id) AS receiptCount, SUM(r.totalPrice) AS priceSum 
                        FROM (SELECT * FROM receipt_receipt GROUP BY link) r
                        JOIN company_companyunit u ON r.companyUnit = u.id
                        JOIN company_company c ON u.company = c.tin
                        JOIN company_company_type ct ON c.tin = ct.company_id
                        JOIN company_companytype t ON ct.companytype_id = t.id
                        WHERE r.date BETWEEN %s AND %s
                        AND t.user = %s
                        GROUP BY t.id
                ) innerQuery 
                    ORDER BY priceSum DESC, receiptCount DESC
                    LIMIT %s;
                ''', 
                [dateFrom, dateTo, user.id, limit])
            most_spent_types = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT innerQuery.companyType, innerQuery.receiptCount AS receiptCount, innerQuery.priceSum FROM (
                    SELECT t.name AS companyType, COUNT(r.id) AS receiptCount, SUM(r.totalPrice) AS priceSum 
                        FROM (SELECT * FROM receipt_receipt WHERE user = %s GROUP BY link) r
                        JOIN company_companyunit u ON r.companyUnit = u.id
                        JOIN company_company c ON u.company = c.tin
                        JOIN company_company_type ct ON c.tin = ct.company_id
                        JOIN company_companytype t ON ct.companytype_id = t.id
                        WHERE r.date BETWEEN %s AND %s
                        AND t.user = %s
                        GROUP BY t.id
                ) innerQuery 
                    ORDER BY priceSum DESC, receiptCount DESC
                    LIMIT %s;
                ''', 
                [user.id, dateFrom, dateTo, user.id, limit])
            most_spent_types = dictfetchall(cursor)
    return most_spent_types

def get_most_visited_types(user, dateFrom, dateTo, limit):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT innerQuery.companyType, innerQuery.receiptCount AS receiptCount, innerQuery.priceSum FROM (
                    SELECT t.name AS companyType, COUNT(r.id) AS receiptCount, SUM(r.totalPrice) AS priceSum 
                        FROM (SELECT * FROM receipt_receipt GROUP BY link) r
                        JOIN company_companyunit u ON r.companyUnit = u.id
                        JOIN company_company c ON u.company = c.tin
                        JOIN company_company_type ct ON c.tin = ct.company_id
                        JOIN company_companytype t ON ct.companytype_id = t.id
                        WHERE r.date BETWEEN %s AND %s
                        AND t.user = %s
                        GROUP BY t.id
                ) innerQuery 
                    ORDER BY priceSum DESC, receiptCount DESC
                    LIMIT %s;
                ''', 
                [dateFrom, dateTo, user.id, limit])
            most_visited_types = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT innerQuery.companyType, innerQuery.receiptCount AS receiptCount, innerQuery.priceSum FROM (
                    SELECT t.name AS companyType, COUNT(r.id) AS receiptCount, SUM(r.totalPrice) AS priceSum 
                        FROM (SELECT * FROM receipt_receipt WHERE user = %s GROUP BY link) r
                        JOIN company_companyunit u ON r.companyUnit = u.id
                        JOIN company_company c ON u.company = c.tin
                        JOIN company_company_type ct ON c.tin = ct.company_id
                        JOIN company_companytype t ON ct.companytype_id = t.id
                        WHERE r.date BETWEEN %s AND %s
                        AND t.user = %s
                        GROUP BY t.id
                ) innerQuery 
                    ORDER BY receiptCount DESC, priceSum DESC
                    LIMIT %s;
                ''', 
                [user.id, dateFrom, dateTo, user.id, limit])
            most_visited_types = dictfetchall(cursor)
    return most_visited_types

def get_company_visits(user, tin):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT count(*), SUM(r.totalPrice) FROM receipt_receipt r
                    JOIN company_companyunit u ON r.companyUnit = u.id
                    WHERE u.company = %s
                ''', 
                [tin])
            row = cursor.fetchone()
    else:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT count(*), SUM(r.totalPrice) FROM receipt_receipt r
                    JOIN company_companyunit u ON r.companyUnit = u.id
                    WHERE r.user = %s AND u.company = %s
                ''', 
                [user.id, tin])
            row = cursor.fetchone()
            
    company_visits = {
        "visits": row[0],
        "spent": row[1]
    }
    return company_visits

def filter_receipts(user, dateFrom, dateTo, id, unitName, tin, priceFrom, priceTo, orderBy, ascendingOrder):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT r.* FROM receipt_receipt r JOIN company_companyunit u ON r.companyUnit = u.id WHERE r.date BETWEEN "{dateFrom}" AND "{dateTo}" AND r.id LIKE "{id}" AND u.name LIKE "%{unitName}%" AND u.company LIKE "{tin}%" AND r.totalPrice BETWEEN {priceFrom} AND {priceTo} GROUP BY r.link ORDER BY {orderBy} {ascendingOrder}')
            filtered_receipts = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT r.* FROM receipt_receipt r JOIN company_companyunit u ON r.companyUnit = u.id WHERE r.date BETWEEN "{dateFrom}" AND "{dateTo}" AND r.id LIKE "{id}" AND u.name LIKE "%{unitName}%" AND u.company LIKE "{tin}%" AND r.totalPrice BETWEEN {priceFrom} AND {priceTo} AND r.user = {user.id} ORDER BY {orderBy} {ascendingOrder}')
            filtered_receipts = dictfetchall(cursor)
    return filtered_receipts

def filter_reports(user, dateFrom, dateTo, id, receipt, username, request, orderBy, ascendingOrder):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT r.* FROM receipt_report r JOIN account_user u ON r.user = u.id WHERE r.date BETWEEN "{dateFrom}" AND "{dateTo}" AND r.id LIKE "{id}" AND r.receipt LIKE "{receipt}" AND u.username LIKE "%{username}%" AND r.request LIKE "%{request}%" ORDER BY {orderBy} {ascendingOrder}')
            filtered_reports = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT r.* FROM receipt_report r WHERE r.date BETWEEN "{dateFrom}" AND "{dateTo}" AND r.id LIKE "{id}" AND r.receipt LIKE "{receipt}" AND r.request LIKE "%{request}%" AND r.user = {user.id} ORDER BY {orderBy} {ascendingOrder}')
            filtered_reports = dictfetchall(cursor)
    return filtered_reports

def filter_companies(user, name, tin, type, orderBy, ascendingOrder):
    if (user.role == "ADMIN"):
        with connection.cursor() as cursor:
            if (type == "%"):
                cursor.execute(f'SELECT c.* FROM company_company c LEFT JOIN company_company_type ct ON c.tin = ct.company_id LEFT JOIN company_companytype t ON ct.companytype_id = t.id WHERE c.name LIKE "%{name}%" AND c.tin LIKE "%{tin}%" AND (t.name LIKE "%" OR t.name IS NULL) GROUP BY c.tin ORDER BY {orderBy} {ascendingOrder}')
            else:
                cursor.execute(f'SELECT c.* FROM company_company c LEFT JOIN company_company_type ct ON c.tin = ct.company_id LEFT JOIN company_companytype t ON ct.companytype_id = t.id WHERE c.name LIKE "%{name}%" AND c.tin LIKE "%{tin}%" AND t.name LIKE "%{type}%" GROUP BY c.tin ORDER BY {orderBy} {ascendingOrder}')
            filtered_reports = dictfetchall(cursor)
    else:
        with connection.cursor() as cursor:
            if (type == "%"):
                cursor.execute(f'SELECT c.* FROM company_company c LEFT JOIN company_company_type ct ON c.tin = ct.company_id LEFT JOIN company_companytype t ON ct.companytype_id = t.id JOIN company_companyunit u ON c.tin = u.company JOIN receipt_receipt r ON u.id = r.companyUnit WHERE c.name LIKE "%{name}%" AND c.tin LIKE "%{tin}%" AND (t.name LIKE "%" OR t.name IS NULL) AND r.user = {user.id}  GROUP BY c.tin ORDER BY {orderBy} {ascendingOrder}')
            else:
                cursor.execute(f'SELECT c.* FROM company_company c LEFT JOIN company_company_type ct ON c.tin = ct.company_id LEFT JOIN company_companytype t ON ct.companytype_id = t.id JOIN company_companyunit u ON c.tin = u.company JOIN receipt_receipt r ON u.id = r.companyUnit WHERE c.name LIKE "%{name}%" AND c.tin LIKE "%{tin}%" AND t.name LIKE "%{type}%" AND r.user = {user.id}  GROUP BY c.tin ORDER BY {orderBy} {ascendingOrder}')
            filtered_reports = dictfetchall(cursor)
    return filtered_reports

def filter_users(id, username, email, orderBy, ascendingOrder):
    with connection.cursor() as cursor:
        cursor.execute(f'SELECT * FROM account_user WHERE id LIKE "%{id}%" AND username LIKE "%{username}%" AND email LIKE "%{email}%" AND role = "REGULAR" ORDER BY {orderBy} {ascendingOrder}')
        filtered_users = dictfetchall(cursor)
    return filtered_users



# ==========================================================
#                   PLOT RELATED FUNCTIONS
# ==========================================================

def get_receipts_hours_info(receipts_by_hour, money_spent_by_hour):
    hours = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    counts = []
    spent = []
    
    for rec_info, spent_info in zip(receipts_by_hour, money_spent_by_hour):
        counts.append(rec_info['count'])
        spent.append(spent_info['spent'])
    
    return hours, counts, spent

def get_receipts_weekdays_info(receipts_by_weekday, money_spent_by_weekday):
    weekdays = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"]
    counts = []
    spent = []
    
    for rec_info, spent_info in zip(receipts_by_weekday, money_spent_by_weekday):
        counts.append(rec_info['count'])
        spent.append(spent_info['spent'])
    
    return weekdays, counts, spent

def get_receipts_months_info(receipts_by_month, money_spent_by_month):
    months = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"]
    counts = []
    spent = []
    
    for rec_info, spent_info in zip(receipts_by_month, money_spent_by_month):
        counts.append(rec_info['count'])
        spent.append(spent_info['spent'])
    
    return months, counts, spent
    