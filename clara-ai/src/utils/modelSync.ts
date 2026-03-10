// Fonction utilitaire pour synchroniser les données des modèles
export const syncModelsData = (queryClient: any) => {
  // Forcer un reset complet de toutes les queries liées aux modèles
  void queryClient.resetQueries({
    queryKey: [["userModels"]],
    exact: false,
  });

  // Forcer un refetch immédiat
  void queryClient.refetchQueries({
    queryKey: [["userModels"]],
    exact: false,
  });
};

// Fonction utilitaire pour synchroniser avec utils (pour les mutations tRPC)
export const syncModelsWithUtils = (utils: any) => {
  void utils.userModels.getModels.invalidate();
  void utils.userModels.getModelById.invalidate();
};
