import {useState} from 'react';
import {useSelector} from 'react-redux';

import {StoreState} from '../../store/types';
import {Web3TxStatus} from '../web3/types';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useDao} from '../../hooks';
import {truncateEthAddress} from '../../util/helpers';
import {TX_CYCLE_MESSAGES} from '../web3/config';

import {CycleEllipsis} from '../feedback';
import Modal from '../common/Modal';
import Loader from '../feedback/Loader';
import TimesSVG from '../../assets/svg/TimesSVG';
import CycleMessage from '../feedback/CycleMessage';
import EtherscanURL from '../web3/EtherscanURL';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import FadeIn from '../common/FadeIn';

type FinalizeModalProps = {
  isOpen: boolean;
  closeHandler: () => void;
};

export default function FinalizeModal({
  isOpen,
  closeHandler,
}: FinalizeModalProps) {
  /**
   * State
   */
  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Selectors
   */
  const {DaoRegistryContract} = useSelector(
    (state: StoreState) => state.contracts
  );

  /**
   * Hooks
   */
  const {
    txError,
    txEtherscanURL,
    txIsPromptOpen,
    txSend,
    txStatus,
  } = useContractSend();
  const gasPrices = useETHGasPrice();
  const {dao} = useDao();
  const {connected, account} = useWeb3Modal();

  /**
   * Variables
   */
  const TIMEOUT_INTERVAL = 3000;
  const isConnected = connected && account;
  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING;
  const isDone = txStatus === Web3TxStatus.FULFILLED;
  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;
  const finalizeError = submitError || txError;

  function renderSubmitStatus(): React.ReactNode {
    // Only for chain tx
    switch (txStatus) {
      case Web3TxStatus.AWAITING_CONFIRM:
        return (
          <>
            Awaiting your confirmation
            <CycleEllipsis />
          </>
        );
      case Web3TxStatus.PENDING:
        return (
          <>
            <CycleMessage
              intervalMs={2000}
              messages={TX_CYCLE_MESSAGES}
              useFirstItemStart
              render={(message) => {
                return <FadeIn key={message}>{message}</FadeIn>;
              }}
            />

            <EtherscanURL url={txEtherscanURL} isPending />
          </>
        );
      case Web3TxStatus.FULFILLED:
        return (
          <>
            <div>{'Finalized!'}</div>

            <EtherscanURL url={txEtherscanURL} />
          </>
        );
      default:
        return null;
    }
  }

  async function finalizeDao(): Promise<void> {
    try {
      if (!isConnected) {
        throw new Error(
          'No user account was found. Please makes sure your wallet is connected.'
        );
      }

      if (!DaoRegistryContract) {
        throw new Error('No DAO Registry contract was found.');
      }

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `finalizeDao`
      await txSend(
        'finalizeDao',
        DaoRegistryContract.instance.methods,
        [],
        txArguments
      );

      // Close modal
      closeHandler &&
        setTimeout(() => {
          closeHandler();
        }, TIMEOUT_INTERVAL);
    } catch (error) {
      setSubmitError(error);
    }
  }

  return (
    <Modal
      keyProp="adapter-extension-finalize"
      isOpen={isOpen}
      isOpenHandler={() => {
        closeHandler();
      }}>
      {/* MODEL CLOSE BUTTON */}
      <>
        <span
          className="modal__close-button"
          onClick={() => {
            closeHandler();
          }}>
          <TimesSVG />
        </span>

        <h1>Finalize </h1>
        <h2>
          {dao && dao.name}{' '}
          <small>{dao && truncateEthAddress(dao.daoAddress, 7)}</small>
        </h2>
        <p>
          After your DAO is finalized you will need to submit a proposal to make
          changes.
        </p>

        {/* SUBMIT */}
        <button
          className="button"
          disabled={isInProcessOrDone}
          onClick={() => {
            if (isInProcessOrDone) return;

            finalizeDao();
          }}
          type="submit">
          {isInProcess ? <Loader /> : isDone ? 'Done' : 'Submit'}
        </button>

        {/* SUBMIT STATUS */}

        {isInProcessOrDone && (
          <div className="form__submit-status-container">
            {renderSubmitStatus()}
          </div>
        )}

        {/* SUBMIT ERROR */}
        {finalizeError && (
          <div className="form__submit-error-container">
            <ErrorMessageWithDetails
              renderText="Something went wrong while trying to finalize the DAO."
              error={finalizeError}
            />
          </div>
        )}
      </>
    </Modal>
  );
}
