import json
import re

# Load the provinces GeoJSON to get CP mapping
with open('/home/hernan/proyectos/mla/truck-managment/Provincias_Unificadas_CP_Completo_Final.geojson', 'r', encoding='utf-8') as f:
    provinces_data = json.load(f)

# Create mapping: normalized locality name -> list of CP
postal_codes = {}
for feature in provinces_data['features']:
    locality = str(feature['properties'].get('Localidad', '')).strip()
    if locality:
        # Normalize: remove accents, upper case, remove extra spaces
        normalized = re.sub(r'[^\w\s]', '', locality).upper().strip()
        cp_str = str(feature['properties'].get('CP', ''))
        if cp_str:
            cps = [cp.strip() for cp in cp_str.split(',') if cp.strip()]
            if normalized not in postal_codes:
                postal_codes[normalized] = []
            postal_codes[normalized].extend(cps)

# Remove duplicates
for loc in postal_codes:
    postal_codes[loc] = list(set(postal_codes[loc]))

# Load the localities GeoJSON
with open('/home/hernan/proyectos/mla/truck-managment/Localidades_Poly_2022_WGS84.geojson.json', 'r', encoding='utf-8') as f:
    localities_data = json.load(f)

# Add postal code to each locality feature
for feature in localities_data['features']:
    locality = feature['properties']['LOCALIDAD'].strip()
    # Normalize similarly
    normalized = re.sub(r'[^\w\s]', '', locality).upper().strip()
    cp = postal_codes.get(normalized, ["Desconocido"])
    feature['properties']['codigo_postal'] = cp

# Save the modified localities file
with open('/home/hernan/proyectos/mla/truck-managment/Localidades_Poly_2022_WGS84_con_CP.geojson.json', 'w', encoding='utf-8') as f:
    json.dump(localities_data, f, ensure_ascii=False, indent=2)

print("Archivo modificado guardado como Localidades_Poly_2022_WGS84_con_CP.geojson.json")
print(f"Mapeo creado para {len(postal_codes)} localidades únicas.")