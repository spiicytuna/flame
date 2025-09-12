const App = require('../../../models/App');
const Logger = require('../../../utils/Logger');
const logger = new Logger();
const loadConfig = require('../../../utils/loadConfig');

const useKubernetes = async (apps) => {
  try {
    const k8s = await import('@kubernetes/client-node');
    const { useOrdering: orderType, unpinStoppedApps } = await loadConfig();

    let ingresses = [];

    // --- Connect to the Kubernetes API ---
    // works only if running inside a Kubernetes cluster
    try {
      const kc = new k8s.KubeConfig();
      kc.loadFromCluster(); // Load credentials

      const k8sNetworkingV1Api = kc.makeApiClient(k8s.NetworkingV1Api);
      const res = await k8sNetworkingV1Api.listIngressForAllNamespaces();
      ingresses = res.body.items;
    } catch (err) {
      // detailed error => connection fail
      logger.log(`Can't connect to the Kubernetes API. Is Flame running in a cluster? Error: ${err.message}`, 'ERROR');
      return; // stop no connection
    }

    if (ingresses && ingresses.length > 0) {
      // --- ingresses annotations ---
      const kubernetesApps = ingresses
        .filter((e) => e.metadata && e.metadata.annotations) // annotations exist???
        .map((ingress) => ingress.metadata.annotations)
        .filter(
          (annotations) =>
            'flame.pawelmalak/name' in annotations &&
            'flame.pawelmalak/url' in annotations &&
            /^app/.test(annotations['flame.pawelmalak/type'])
        )
        .map((annotations) => ({
          name: annotations['flame.pawelmalak/name'],
          url: annotations['flame.pawelmalak/url'],
          icon: annotations['flame.pawelmalak/icon'] || 'kubernetes',
        }));

      // --- Sync db with discovered apps ---
      const currentApps = await App.findAll({ order: [[orderType, 'ASC']] });

      if (unpinStoppedApps) {
        for (const app of currentApps) {
          // Unpin all apps b4 re-pinning ones found @ Kubernetes
          await app.update({ isPinned: false });
        }
      }

      for (const item of kubernetesApps) {
        const existingApp = currentApps.find((a) => a.name === item.name);
        if (existingApp) {
          // update existing app+pin
          await existingApp.update({ ...item, isPinned: true });
        } else {
          // create new app+pin
          await App.create({ ...item, isPinned: true });
        }
      }
    }
  } catch (err) {
    logger.log(`An unexpected error occurred in the Kubernetes service: ${err.message}`, 'ERROR');
  }
};

module.exports = useKubernetes;
