# Kubernetes manifests (starter)

This folder contains **plain Kubernetes YAML** manifests to deploy the stack.

## What’s included
- `namespace.yaml`: optional namespace
- `mysql.yaml`: MySQL Deployment + Service + PVC + Secret
- `memcached.yaml`: Memcached Deployment + Service
- `rabbitmq.yaml`: RabbitMQ Deployment + Service
- `apps.yaml`: Application (Tomcat) Deployment + Service
- `nginx.yaml`: Nginx Deployment + Service + ConfigMap
- `kustomization.yaml`: simple kustomize entrypoint (optional)

## Before applying
1. Replace the image placeholders in `k8s/kustomization.yaml`:
   - `REPLACE_REGISTRY` (example: `registry.mycorp.local:5000`)
   - `REPLACE_IMAGE_TAG` (example: `v1` or a Git SHA)
2. (Recommended) Replace MySQL credentials in `mysql.yaml` secret.
3. Storage: update `mysql.yaml` PVC:
   - set `storageClassName` to your on-prem StorageClass (NFS/OpenEBS/Rook/etc), or
   - remove `storageClassName` if your cluster has a default StorageClass.
4. Ingress (optional): `ingress.yaml` is configured for **nginx ingress class**.
   - If you don't have an ingress controller, you can skip applying `ingress.yaml` and access via the `nginx` NodePort instead.

## Apply
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -k k8s/
```

## Notes
- These are intended as a **starting point** for moving to Helm later.
- For production, consider:
  - external DB (RDS) instead of in-cluster MySQL
  - NetworkPolicies, resource limits, PodDisruptionBudgets, HPA
  - sealed-secrets / external-secrets for credentials

