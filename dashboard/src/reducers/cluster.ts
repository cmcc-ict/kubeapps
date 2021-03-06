import { LOCATION_CHANGE, LocationChangeAction } from "connected-react-router";
import { getType } from "typesafe-actions";

import { IConfig } from "shared/Config";
import { getCurrentNamespace } from "shared/Namespace";
import actions from "../actions";
import { AuthAction } from "../actions/auth";
import { ConfigAction } from "../actions/config";
import { NamespaceAction } from "../actions/namespace";
import { Auth } from "../shared/Auth";

export interface IClusterState {
  currentNamespace: string;
  namespaces: string[];
  error?: { action: string; error: Error };
}

interface IClustersMap {
  [cluster: string]: IClusterState;
}

export interface IClustersState {
  currentCluster: string;
  clusters: IClustersMap;
}

const getInitialState: () => IClustersState = (): IClustersState => {
  const token = Auth.getAuthToken() || "";
  return {
    currentCluster: "default",
    clusters: {
      default: {
        currentNamespace: Auth.defaultNamespaceFromToken(token),
        namespaces: [],
      },
    },
  } as IClustersState;
};
export const initialState: IClustersState = getInitialState();

const clusterReducer = (
  state: IClustersState = initialState,
  action: ConfigAction | NamespaceAction | LocationChangeAction | AuthAction,
): IClustersState => {
  switch (action.type) {
    case getType(actions.namespace.receiveNamespace):
      if (
        !state.clusters[action.payload.cluster].namespaces.includes(
          action.payload.namespace.metadata.name,
        )
      ) {
        return {
          ...state,
          clusters: {
            ...state.clusters,
            [action.payload.cluster]: {
              ...state.clusters[action.payload.cluster],
              namespaces: state.clusters[action.payload.cluster].namespaces
                .concat(action.payload.namespace.metadata.name)
                .sort(),
              error: undefined,
            },
          },
        };
      }
      return state;
    case getType(actions.namespace.receiveNamespaces):
      return {
        ...state,
        clusters: {
          ...state.clusters,
          [action.payload.cluster]: {
            ...state.clusters[action.payload.cluster],
            namespaces: action.payload.namespaces,
            currentNamespace: getCurrentNamespace(
              action.payload.cluster,
              state.clusters[action.payload.cluster].currentNamespace,
              action.payload.namespaces,
            ),
            error: undefined,
          },
        },
      };
    case getType(actions.namespace.setNamespaceState):
      return {
        ...state,
        currentCluster: action.payload.cluster,
        clusters: {
          ...state.clusters,
          [action.payload.cluster]: {
            ...state.clusters[state.currentCluster],
            currentNamespace: action.payload.namespace,
            error: undefined,
          },
        },
      };
    case getType(actions.namespace.errorNamespaces):
      return {
        ...state,
        clusters: {
          ...state.clusters,
          [action.payload.cluster]: {
            ...state.clusters[action.payload.cluster],
            error: { action: action.payload.op, error: action.payload.err },
          },
        },
      };
    case getType(actions.namespace.clearClusters):
      return {
        ...state,
        clusters: {
          ...initialState.clusters,
        },
      };
    case LOCATION_CHANGE:
      const pathname = action.payload.location.pathname;
      // looks for either or both of /c/:cluster and /ns/:namespace in URL
      const matches = pathname.match(/(?:\/c\/(?<cluster>[^/]*))?(?:\/ns\/(?<namespace>[^/]*))?/);
      if (matches && matches.groups) {
        let [currentCluster, currentNamespace] = [matches.groups.cluster, matches.groups.namespace];
        currentCluster = currentCluster || state.currentCluster;
        currentNamespace = currentNamespace || state.clusters[currentCluster].currentNamespace;
        return {
          ...state,
          currentCluster,
          clusters: {
            ...state.clusters,
            [currentCluster]: {
              ...state.clusters[currentCluster],
              currentNamespace,
            },
          },
        };
      }
      break;
    case getType(actions.config.receiveConfig):
      // Initialize the clusters when receiving the config.
      const config = action.payload as IConfig;
      const clusters: IClustersMap = {};
      config.clusters.forEach(cluster => {
        clusters[cluster] = {
          currentNamespace: "",
          namespaces: [],
        };
      });

      return {
        ...state,
        currentCluster: config.clusters[0],
        clusters,
      };
    default:
  }
  return state;
};

export default clusterReducer;
