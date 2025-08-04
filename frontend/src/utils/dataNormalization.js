// Normalisation des données pour éviter la redondance
export const normalizeData = (data) => {
  const entities = {
    campaigns: {},
    employees: {},
    pairs: {},
    workflows: {},
  };

  // Normaliser les campagnes
  data.forEach((campaign) => {
    entities.campaigns[campaign.id] = {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      employee_count: campaign.employee_count,
      pairs_count: campaign.pairs_count,
      workflow_state_id: campaign.workflow_state?.id,
    };

    // Normaliser le workflow
    if (campaign.workflow_state) {
      entities.workflows[campaign.workflow_state.id] = campaign.workflow_state;
    }

    // Normaliser les employés si présents
    if (campaign.employees) {
      campaign.employees.forEach((employee) => {
        entities.employees[employee.id] = employee;
      });
    }

    // Normaliser les paires si présentes
    if (campaign.pairs) {
      campaign.pairs.forEach((pair) => {
        entities.pairs[pair.id] = pair;
      });
    }
  });

  return entities;
};

// Sélecteurs pour accéder aux données normalisées
export const selectors = {
  getCampaign: (state, id) => state.campaigns[id],
  getCampaignWorkflow: (state, id) => {
    const campaign = state.campaigns[id];
    return campaign ? state.workflows[campaign.workflow_state_id] : null;
  },
  getCampaignEmployees: (state, id) => {
    return Object.values(state.employees).filter(
      (employee) => employee.campaign_id === id
    );
  },
  getCampaignPairs: (state, id) => {
    return Object.values(state.pairs).filter(
      (pair) => pair.campaign_id === id
    );
  },
};

// Utilitaire pour comparer les données et éviter les mises à jour inutiles
export const hasDataChanged = (oldData, newData) => {
  if (!oldData) return true;
  
  // Comparaison profonde des objets
  return JSON.stringify(oldData) !== JSON.stringify(newData);
};
