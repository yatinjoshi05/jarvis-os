import { useState, useEffect } from 'react';
import { VoiceState, voiceStateMachine } from './VoiceStateMachine';
import { globeStateManager } from '../../entities/globe/model/GlobeStateManager';

class AssistantState {
  private listeners: Set<() => void> = new Set();

  private _transcript = '';
  private _response = '';
  private _caption = '';
  private _error = '';
  private _streamingResponse = '';

  constructor() {
    voiceStateMachine.subscribe((newState) => {
      globeStateManager.setVoiceState(newState);
      this.notify();
    });
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public get state(): VoiceState {
    return voiceStateMachine.state;
  }

  public get listening() {
    return this.state === 'LISTENING';
  }

  public set listening(val: boolean) {
    if (val) {
      voiceStateMachine.transitionTo('LISTENING');
    } else {
      if (voiceStateMachine.state === 'LISTENING') {
        voiceStateMachine.transitionTo('IDLE');
      }
    }
  }

  public get speaking() {
    return this.state === 'SPEAKING';
  }

  public set speaking(val: boolean) {
    if (val) {
      voiceStateMachine.transitionTo('SPEAKING');
    } else {
      if (voiceStateMachine.state === 'SPEAKING') {
        voiceStateMachine.transitionTo('IDLE');
      }
    }
  }

  public get thinking() {
    return ['THINKING', 'STREAMING'].includes(this.state);
  }

  public set thinking(val: boolean) {
    if (val) {
      voiceStateMachine.transitionTo('THINKING');
    } else {
      if (this.thinking) {
        voiceStateMachine.transitionTo('IDLE');
      }
    }
  }

  public get muted() {
    return this.state === 'MUTED';
  }

  public get permissionDenied() {
    return this.state === 'PERMISSION_DENIED';
  }

  public get transcript() {
    return this._transcript;
  }

  public set transcript(val: string) {
    this._transcript = val;
    console.log(`[AssistantState] Transcript: "${val}"`);
    this.notify();
  }

  public get response() {
    return this._response;
  }

  public set response(val: string) {
    this._response = val;
    this.notify();
  }

  public get caption() {
    return this._caption;
  }

  public set caption(val: string) {
    this._caption = val;
    console.log(`[AssistantState] Caption: "${val}"`);
    this.notify();
  }

  public get error() {
    return this._error;
  }

  public set error(val: string) {
    this._error = val;
    this.notify();
  }

  public get streamingResponse() {
    return this._streamingResponse;
  }

  public set streamingResponse(val: string) {
    this._streamingResponse = val;
    this.notify();
  }

  public handleStateTransition(nextState: VoiceState) {
    if (nextState === 'IDLE') {
      this._error = '';
    }
    this.notify();
  }

  startListening() {
    voiceStateMachine.transitionTo('LISTENING');
    this._error = '';
    this.notify();
  }

  stopListening() {
    if (voiceStateMachine.state === 'LISTENING') {
      voiceStateMachine.transitionTo('IDLE');
    }
  }

  startThinking() {
    voiceStateMachine.transitionTo('THINKING');
    this._error = '';
    this.notify();
  }

  stopThinking() {
    if (this.thinking) {
      voiceStateMachine.transitionTo('IDLE');
    }
  }

  startSpeaking(text: string) {
    this._response = text;
    this._error = '';
    voiceStateMachine.transitionTo('SPEAKING');
  }

  stopSpeaking() {
    if (voiceStateMachine.state === 'SPEAKING') {
      voiceStateMachine.transitionTo('IDLE');
    }
  }

  updateTranscript(text: string) {
    this._transcript = text;
    this.notify();
  }

  setCaption(text: string) {
    this._caption = text;
    this.notify();
  }

  setError(text: string) {
    this._error = text;
    voiceStateMachine.transitionTo('ERROR');
  }

  setMuted() {
    voiceStateMachine.transitionTo('MUTED');
  }

  setPermissionDenied() {
    voiceStateMachine.transitionTo('PERMISSION_DENIED');
  }

  reset() {
    this._transcript = '';
    this._response = '';
    this._caption = '';
    this._error = '';
    this._streamingResponse = '';
    voiceStateMachine.transitionTo('IDLE');
  }
}

export const assistantState = new AssistantState();

export function useAssistantState() {
  const [state, setState] = useState({
    state: assistantState.state,
    listening: assistantState.listening,
    speaking: assistantState.speaking,
    thinking: assistantState.thinking,
    transcript: assistantState.transcript,
    response: assistantState.response,
    caption: assistantState.caption,
    error: assistantState.error,
    muted: assistantState.muted,
    permissionDenied: assistantState.permissionDenied,
    streamingResponse: assistantState.streamingResponse,
  });

  useEffect(() => {
    return assistantState.subscribe(() => {
      setState({
        state: assistantState.state,
        listening: assistantState.listening,
        speaking: assistantState.speaking,
        thinking: assistantState.thinking,
        transcript: assistantState.transcript,
        response: assistantState.response,
        caption: assistantState.caption,
        error: assistantState.error,
        muted: assistantState.muted,
        permissionDenied: assistantState.permissionDenied,
        streamingResponse: assistantState.streamingResponse,
      });
    });
  }, []);

  return state;
}
export default assistantState;