import os
import django

# === Django setup ===
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from accounts.models import State

def run_state_seeder():
    raw_states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh (UT)',
        'Chhattisgarh', 'Dadra and Nagar Haveli (UT)', 'Daman and Diu (UT)', 'Delhi (NCT)', 'Goa',
        'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
        'Kerala', 'Lakshadweep (UT)', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
        'Mizoram', 'Nagaland', 'Odisha', 'Puducherry (UT)', 'Punjab', 'Rajasthan', 'Sikkim',
        'Tamil Nadu', 'Telangana', 'Tripura', 'Uttarakhand', 'Uttar Pradesh', 'West Bengal'
    ]

    # Preprocess input and generate name/code/UT status
    processed_states = []
    for full_name in raw_states:
        is_ut = "(UT)" in full_name or "Delhi" in full_name or "NCT" in full_name
        clean_name = full_name.replace(" (UT)", "").replace(" (NCT)", "")
        code = ''.join([word[0] for word in clean_name.split() if word[0].isalpha()]).upper()[:3]
        processed_states.append({
            'name': clean_name,
            'code': code,
            'is_union_territory': is_ut
        })

    # Get existing state names to avoid duplicates
    existing_names = set(State.objects.values_list('name', flat=True))

    # Filter out states already in DB
    new_states = [
        State(**data) for data in processed_states if data['name'] not in existing_names
    ]

    # Bulk insert only new ones
    if new_states:
        State.objects.bulk_create(new_states)
        print(f"✅ {len(new_states)} new states seeded.")
    else:
        print("ℹ️ No new states to seed. Already up to date.")

if __name__ == "__main__":
    run_state_seeder()
