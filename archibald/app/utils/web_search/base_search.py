import os
import random
import signal
from typing import Any, Dict

import psutil
from tavily import TavilyClient

from app.core.config import settings


def kill_chrome_processes():
    """Tue uniquement les processus Chrome de notre application."""
    try:
        current_pid = os.getpid()
        for proc in psutil.process_iter(["pid", "name", "cmdline"]):
            try:
                # Vérifier si c'est un processus Chrome
                if "chrome" in proc.info["name"].lower():
                    # Vérifier si c'est un processus de notre application
                    cmdline = proc.info["cmdline"]
                    if cmdline and any(
                        "--remote-debugging-port" in arg for arg in cmdline
                    ):
                        # Vérifier si le processus parent est notre application
                        parent = proc.parent()
                        if parent and parent.pid == current_pid:
                            proc.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
    except Exception:
        pass


def signal_handler(sig, frame):
    kill_chrome_processes()
    # Ne pas utiliser sys.exit() qui force l'arrêt
    os._exit(0)  # Arrêt plus propre


# Enregistrer les gestionnaires de signal
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


class SearchResult:
    def __init__(self, title: str, url: str, content: str):
        self.title = title
        self.url = url
        self.content = content


def get_random_user_agent():
    """Retourne un User-Agent aléatoire pour éviter la détection."""
    user_agents = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    ]
    return random.choice(user_agents)


async def base_search(question: str) -> Dict[str, Any]:
    """
    Effectue une recherche web basique avec Tavily.

    Args:
        question (str): La question/recherche à effectuer

    Returns:
        Dict[str, Any]: Résultats de la recherche
    """
    try:
        # Extraire la requête après les mots-clés
        search_keywords = [
            "recherche",
            "cherche",
            "trouve",
            "donne moi",
            "montre moi",
            "informations sur",
        ]
        query = question.lower()

        # Trouver le mot-clé et extraire la requête
        search_query = None
        for keyword in search_keywords:
            if keyword in query:
                search_query = query.split(keyword, 1)[1].strip()
                break

        if not search_query:
            return {
                "results": [],
                "message": "Aucun mot-clé de recherche trouvé dans la question",
            }

        tavily_api_key = settings.TAVILY_API_KEY

        if not tavily_api_key:
            return {
                "results": [],
                "message": "Erreur de configuration de l'API Tavily",
            }

        # Initialiser le client Tavily
        tavily_client = TavilyClient(api_key=tavily_api_key)

        # Faire la recherche avec Tavily (optimisé pour la vitesse)
        response = tavily_client.search(
            query=search_query,
            search_depth="basic",  # Plus rapide que "advanced"
            include_answer=True,
            include_raw_content=False,  # Désactivé pour la vitesse
            max_results=3,  # Réduit de 5 à 3
        )

        # Traiter les résultats (sans extraction pour la vitesse)
        search_results = []
        for result in response.get("results", []):
            try:
                # Utiliser directement le contenu de la recherche (plus rapide)
                content = result.get("content", "")[:300]  # Limiter à 300 chars

                search_results.append(
                    {
                        "title": result.get("title", ""),
                        "url": result.get("url", ""),
                        "content": content,
                    }
                )
            except Exception:
                continue

        if not search_results:
            return {
                "results": [],
                "message": "Aucun résultat trouvé sur Tavily",
            }

        return {
            "results": search_results,
            "message": f"Recherche effectuée pour : {search_query}",
        }

    except Exception as e:
        return {
            "results": [],
            "message": f"Erreur lors de la recherche web : {str(e)}",
        }


async def read_url_content(url: str) -> SearchResult:
    """
    Lit le contenu d'une URL spécifique en utilisant Tavily Extract.

    Args:
        url (str): L'URL à lire

    Returns:
        SearchResult: Le résultat contenant le titre et le contenu de la page
    """
    try:
        tavily_api_key = settings.TAVILY_API_KEY
        if not tavily_api_key:
            raise Exception(
                "TAVILY_API_KEY non définie dans les variables d'environnement"
            )

        # Initialiser le client Tavily
        tavily_client = TavilyClient(api_key=tavily_api_key)

        # Utiliser Tavily Extract pour obtenir le contenu
        response = tavily_client.extract(url)

        return SearchResult(
            title=response.get("title", url),
            url=url,
            content=response.get("content", "")[:10000],  # Limiter la taille du contenu
        )

    except Exception as e:
        raise Exception(f"Erreur lors de la lecture de l'URL : {str(e)}") from e
