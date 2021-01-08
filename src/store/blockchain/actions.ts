import Web3 from 'web3';
import {Dispatch} from 'redux';

import {ContractAdapterNames} from '../../components/web3/types';
import {DAO_REGISTRY_CONTRACT_ADDRESS} from '../../config';
import {getAdapterAddress} from '../../components/web3/helpers';
import {StoreState} from '../../util/types';
import DaoRegistry from '../../truffle-contracts/DaoRegistry.json';
import OffchainVotingContract from '../../truffle-contracts/OffchainVotingContract.json';
import OnboardingContract from '../../truffle-contracts/OnboardingContract.json';

export const BLOCKCHAIN_CONTRACTS = 'BLOCKCHAIN_CONTRACTS';

/**
 * @todo Rename this Redux state slice to be `contracts` - more focused.
 * @todo Add inits for Transfer and Tribute when ready
 */

export function initContractDaoRegistry(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const networkId = await web3Instance.eth.net.getId();
        const daoRegistryContract: Record<string, any> = DaoRegistry;
        const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS[networkId];
        const instance = new web3Instance.eth.Contract(
          daoRegistryContract.abi,
          contractAddress
        );

        dispatch({
          type: BLOCKCHAIN_CONTRACTS,
          contracts: {
            DaoRegistryContract: {
              abi: daoRegistryContract.abi,
              contractAddress,
              instance,
            },
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
}

export function initContractOffchainVoting(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const offchainVotingContract: Record<
          string,
          any
        > = OffchainVotingContract;
        /**
         * Get address via DAO Registry.
         *
         * @note The `DaoRegistryContract` must be set in Redux first.
         */
        const contractAddress = await getAdapterAddress(
          ContractAdapterNames.voting,
          getState().blockchain.contracts?.DaoRegistryContract.instance
        );
        const instance = new web3Instance.eth.Contract(
          offchainVotingContract.abi,
          contractAddress
        );

        dispatch({
          type: BLOCKCHAIN_CONTRACTS,
          contracts: {
            OffchainVotingContract: {
              abi: offchainVotingContract.abi,
              contractAddress,
              instance,
            },
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
}

export function initContractOnboarding(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const onboardingContract: Record<string, any> = OnboardingContract;
        /**
         * Get address via DAO Registry.
         *
         * @note The `DaoRegistryContract` must be set in Redux first.
         */
        const contractAddress = await getAdapterAddress(
          ContractAdapterNames.onboarding,
          getState().blockchain.contracts?.DaoRegistryContract.instance
        );
        const instance = new web3Instance.eth.Contract(
          onboardingContract.abi,
          contractAddress
        );

        dispatch({
          type: BLOCKCHAIN_CONTRACTS,
          contracts: {
            OnboardingContract: {
              abi: onboardingContract.abi,
              contractAddress,
              instance,
            },
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
}
