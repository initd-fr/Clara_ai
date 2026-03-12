////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import Link from "next/link";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default function LicencePage() {
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-100 to-base-200">
      <div className="sticky top-0 z-10 border-b border-base-300/50 bg-base-100/80 px-6 py-6 backdrop-blur-xl sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/settings"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Retour aux paramètres
          </Link>
          <h1 className="mt-2 bg-gradient-to-r from-base-content to-base-content/70 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
            Licence
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            Licence logicielle Clara AI
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="prose max-w-none rounded-2xl border border-base-300/50 bg-base-100 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-base-content">
            Licence d’utilisation — Clara AI
          </h2>
          <p className="mt-4 text-base-content/80">
            Copyright (c) 2025 — Auteur du projet
          </p>
          <p className="mt-4 font-medium text-base-content/80">
            Vous êtes autorisé à :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-base-content/80">
            <li>Consulter le code source en entier</li>
            <li>Utiliser l’application (l’exécuter chez vous, en local ou sur vos propres serveurs)</li>
            <li>Modifier le code pour votre usage personnel ou interne</li>
            <li>Créer des projets dérivés à des fins d’apprentissage ou de démonstration de compétences</li>
          </ul>
          <p className="mt-4 font-medium text-base-content/80">
            Sous les conditions suivantes :
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-2 text-base-content/80">
            <li>
              <strong>Attribution (citation)</strong> — Vous devez conserver la présente notice de licence et indiquer clairement l’origine du code (nom du projet, auteur) dans toute utilisation, diffusion ou œuvre dérivée.
            </li>
            <li>
              <strong>Usage commercial et produits dérivés distribués</strong> — Pour tout usage commercial ou toute distribution (publique ou commerciale) d’un produit ou service basé en tout ou partie sur ce code, vous devez préalablement contacter l’auteur pour en discuter et obtenir son accord.
            </li>
          </ol>
          <p className="mt-4 text-base-content/80">
            Aucune garantie n’est fournie. Ce logiciel est fourni « tel quel ». L’auteur ne pourra être tenu responsable des dommages résultant de son utilisation.
          </p>
        </div>
      </div>
    </div>
  );
}
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
