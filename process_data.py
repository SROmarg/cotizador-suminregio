#!/usr/bin/env python3
"""
Process MicroSIP CSV data and generate dashboard_data.js
"""
import csv
import json
from datetime import datetime
from collections import defaultdict, OrderedDict

# Read CSV files
csv_path = '/sessions/kind-vibrant-hypatia/mnt/MicroSIP_Export/'

print("Loading CSV files...")

# Load DOCTOS_VE (sales documents)
doctos_ve = {}
with open(csv_path + 'DOCTOS_VE.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        docto_id = row['DOCTO_VE_ID']
        doctos_ve[docto_id] = {
            'DOCTO_VE_ID': docto_id,
            'TIPO_DOCTO': row['TIPO_DOCTO'],
            'FECHA': row['FECHA'],
            'CLIENTE_ID': row['CLIENTE_ID'],
            'VENDEDOR_ID': row['VENDEDOR_ID'],
            'IMPORTE_NETO': float(row['IMPORTE_NETO']) if row['IMPORTE_NETO'] else 0,
            'ESTATUS': row['ESTATUS'],
        }

print(f"  Loaded {len(doctos_ve)} sales documents")

# Load CLIENTES (clients)
clientes = {}
with open(csv_path + 'CLIENTES.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cliente_id = row['CLIENTE_ID']
        clientes[cliente_id] = row['NOMBRE']

print(f"  Loaded {len(clientes)} clients")

# Load VENDEDORES (salespeople)
vendedores = {}
with open(csv_path + 'VENDEDORES.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        vendedor_id = row['VENDEDOR_ID']
        vendedores[vendedor_id] = row['NOMBRE']

print(f"  Loaded {len(vendedores)} salespeople")

# Parse dates and filter data
print("\nProcessing sales data...")

sales_data = []
for docto_id, doc in doctos_ve.items():
    # Only count facturas (F) and exclude cancelled (N = normal/active, C = cancelled)
    if doc['TIPO_DOCTO'] != 'F' or doc['ESTATUS'] == 'C':
        continue

    # Parse date
    try:
        # Format: "25/02/2025 12:00:00 a. m." (DD/MM/YYYY)
        fecha_str = doc['FECHA']
        # Replace "a. m." with "AM" and "p. m." with "PM" for parsing
        fecha_str = fecha_str.replace(' a. m.', ' AM').replace(' p. m.', ' PM')
        date_obj = datetime.strptime(fecha_str, '%d/%m/%Y %I:%M:%S %p')
    except Exception as e:
        print(f"    Error parsing date for {docto_id}: {doc['FECHA']}")
        continue

    cliente_name = clientes.get(doc['CLIENTE_ID'], 'Unknown')
    vendedor_name = vendedores.get(doc['VENDEDOR_ID'], 'Unknown')

    sales_data.append({
        'docto_id': docto_id,
        'date': date_obj,
        'year': date_obj.year,
        'month': date_obj.month,
        'day': date_obj.day,
        'month_str': date_obj.strftime('%B'),
        'month_short': date_obj.strftime('%b'),
        'cliente_id': doc['CLIENTE_ID'],
        'cliente_name': cliente_name,
        'vendedor_id': doc['VENDEDOR_ID'],
        'vendedor_name': vendedor_name,
        'amount': doc['IMPORTE_NETO'],
    })

print(f"  Processed {len(sales_data)} valid facturas")

# Calculate metrics by month
monthly_data = defaultdict(lambda: {
    'total': 0,
    'count': 0,
    'clientes': set(),
    'vendedores': defaultdict(lambda: {'total': 0, 'count': 0}),
    'clientes_list': defaultdict(float),
    'days': defaultdict(float)
})

for sale in sales_data:
    key = (sale['year'], sale['month'])
    monthly_data[key]['total'] += sale['amount']
    monthly_data[key]['count'] += 1
    monthly_data[key]['clientes'].add(sale['cliente_name'])
    monthly_data[key]['vendedores'][sale['vendedor_name']]['total'] += sale['amount']
    monthly_data[key]['vendedores'][sale['vendedor_name']]['count'] += 1
    monthly_data[key]['clientes_list'][sale['cliente_name']] += sale['amount']
    monthly_data[key]['days'][sale['day']] += sale['amount']

# Get available months sorted
available_months = sorted(monthly_data.keys(), reverse=True)
print(f"  Available months: {available_months}")

# Build JavaScript data structure
js_data = {
    'vendedores': list(vendedores.values()),
    'months': [],
}

# For each month, create summary
for year, month in available_months:
    month_data = monthly_data[(year, month)]

    # Get top 10 clients
    top_clientes = sorted(month_data['clientes_list'].items(), key=lambda x: x[1], reverse=True)[:10]

    # Get vendedores ranking
    vendedor_ranking = sorted(
        [(name, data['total'], data['count']) for name, data in month_data['vendedores'].items()],
        key=lambda x: x[1],
        reverse=True
    )

    # Get daily sales for the month
    daily_sales = []
    for day in sorted(month_data['days'].keys()):
        daily_sales.append({
            'day': day,
            'amount': month_data['days'][day]
        })

    month_info = {
        'year': year,
        'month': month,
        'month_name': datetime(year, month, 1).strftime('%B'),
        'month_short': datetime(year, month, 1).strftime('%b'),
        'total_sales': round(month_data['total'], 2),
        'facturas_count': month_data['count'],
        'unique_clientes': len(month_data['clientes']),
        'avg_ticket': round(month_data['total'] / month_data['count'], 2) if month_data['count'] > 0 else 0,
        'top_clientes': [{'name': name, 'amount': round(amount, 2)} for name, amount in top_clientes],
        'vendedores': [{'name': name, 'amount': round(amount, 2), 'count': count} for name, amount, count in vendedor_ranking],
        'daily_sales': daily_sales,
    }

    js_data['months'].append(month_info)

# Calculate quarterly data for current month (most recent)
if available_months:
    current_year, current_month = available_months[0]

    # Get Q for current month
    q_num = (current_month - 1) // 3 + 1
    q_start_month = (q_num - 1) * 3 + 1

    q_total = 0
    q_count = 0
    for year, month in monthly_data.keys():
        if year == current_year and (year, month) in monthly_data:
            month_q = (month - 1) // 3 + 1
            if month_q == q_num:
                q_total += monthly_data[(year, month)]['total']
                q_count += monthly_data[(year, month)]['count']

    js_data['current_quarter'] = {
        'quarter': f'Q{q_num}',
        'year': current_year,
        'total': round(q_total, 2),
        'count': q_count,
    }

# Generate JavaScript file
js_code = f"""// Auto-generated dashboard data
// Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

const dashboardData = {json.dumps(js_data, indent=2)};

const getMonthData = (year, month) => {{
  return dashboardData.months.find(m => m.year === year && m.month === month);
}};

const getVendedores = () => dashboardData.vendedores;

const getAvailableMonths = () => dashboardData.months.map(m => ({{
  label: `${{m.month_name}} ${{m.year}}`,
  value: `${{m.year}}-${{String(m.month).padStart(2, '0')}}`,
  year: m.year,
  month: m.month
}}));

const getLastYearData = (currentYear, currentMonth) => {{
  return dashboardData.months.filter(m => {{
    const key = (m.month - 1);
    const prevMonthKey = currentMonth - 1 === 0 ? 11 : currentMonth - 2;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return m.year === prevYear && m.month === (prevMonthKey + 1);
  }});
}};
"""

output_path = '/sessions/kind-vibrant-hypatia/mnt/Cotizador/dashboard_data.js'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(js_code)

print(f"\nGenerated {output_path}")
print("\nData Summary:")
for year, month in available_months[:5]:
    m = monthly_data[(year, month)]
    print(f"  {month}/{year}: ${m['total']:,.2f} ({m['count']} facturas, {len(m['clientes'])} clientes)")
