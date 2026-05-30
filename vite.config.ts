import { defineConfig } from "vite";

// base relative ("./") : les assets sont référencés en chemins relatifs,
// ce qui fonctionne aussi bien en local qu'à la racine d'un sous-dossier
// GitHub Pages (https://<user>.github.io/jfrgame/).
export default defineConfig({
  base: "./",
});
