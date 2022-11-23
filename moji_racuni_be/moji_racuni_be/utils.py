from bs4 import BeautifulSoup
import requests
from srtools import cyrillic_to_latin

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
    if (item_part.find("[") != -1 and item_part.find("]") != -1):
        return "["
    elif (item_part.find("(") != -1 and item_part.find(")") != -1):
        return "("
    elif (item_part.find("/") != -1):
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
            
            measure_prefix = get_measure_prefix(item_part_filtered["new_part"])
            measure_type = get_measure_type(item_part_filtered["new_part"], measure_prefix)
            item_measures.append(measure_type)

            item_name = get_name(item_part_filtered["new_part"], measure_type, measure_prefix)
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
        "name": receipt.split('\r\n')[2].title(),
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