import os
import django

# === Django setup ===
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  # make sure this path is correct
django.setup()

from accounts.models import State

def run_state_seeder():
    states = [
        {'name': 'Andhra Pradesh'},
        {'name': 'Arunachal Pradesh'},
        {'name': 'Assam'},
        {'name': 'Bihar'},
        {'name': 'Chandigarh (UT)'},
        {'name': 'Chhattisgarh'},
        {'name': 'Dadra and Nagar Haveli (UT)'},
        {'name': 'Daman and Diu (UT)'},
        {'name': 'Delhi (NCT)'},
        {'name': 'Goa'},
        {'name': 'Gujarat'},
        {'name': 'Haryana'},
        {'name': 'Himachal Pradesh'},
        {'name': 'Jammu and Kashmir'},
        {'name': 'Jharkhand'},
        {'name': 'Karnataka'},
        {'name': 'Kerala'},
        {'name': 'Lakshadweep (UT)'},
        {'name': 'Madhya Pradesh'},
        {'name': 'Maharashtra'},
        {'name': 'Manipur'},
        {'name': 'Meghalaya'},
        {'name': 'Mizoram'},
        {'name': 'Nagaland'},
        {'name': 'Odisha'},
        {'name': 'Puducherry (UT)'},
        {'name': 'Punjab'},
        {'name': 'Rajasthan'},
        {'name': 'Sikkim'},
        {'name': 'Tamil Nadu'},
        {'name': 'Telangana'},
        {'name': 'Tripura'},
        {'name': 'Uttarakhand'},
        {'name': 'Uttar Pradesh'},
        {'name': 'West Bengal'},
    ]

    for state in states:
        is_ut = "(UT)" in state['name'] or "Delhi" in state['name'] or "NCT" in state['name']
        clean_name = state['name'].replace(" (UT)", "").replace(" (NCT)", "")
        code = ''.join([word[0] for word in clean_name.split() if word[0].isalpha()]).upper()[:3]

        State.objects.get_or_create(
            name=clean_name,
            defaults={
                'code': code,
                'is_union_territory': is_ut
            }
        )

    print("✅ States seeded successfully.")


if __name__ == "__main__":
    run_state_seeder()
