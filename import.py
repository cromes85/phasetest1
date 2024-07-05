import requests
import json

# URL de l'API pour récupérer tous les Pokémon
api_url = "https://tyradex.vercel.app/api/v1/pokemon"

# Faire une requête GET pour obtenir les données des Pokémon
response = requests.get(api_url)
if response.status_code == 200:
    pokemons = response.json()

    # Fichier de sortie JSON
    output_file = 'pokemon_all.json'

    # Sauvegarder les données dans un fichier JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(pokemons, f, ensure_ascii=False, indent=4)

    print(f"Les informations de tous les Pokémon ont été sauvegardées dans {output_file}")
else:
    print(f"Erreur lors de la récupération des données : {response.status_code}")
