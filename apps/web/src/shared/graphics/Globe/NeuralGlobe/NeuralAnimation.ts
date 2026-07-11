import * as THREE from 'three'

import { neuralGraph } from './NeuralGraph'
import { microphoneManager } from '../../../ai/AIManager'

class NeuralAnimation {
  public voiceStrength = 0

  public thinkingStrength = 0

  public energy = 0

  update(delta: number) {
    //------------------------------------------------
    // Voice
    //------------------------------------------------

    const boostedVoice = Math.min(
      microphoneManager.voiceLevel * 8,
      1
    )

    this.voiceStrength = THREE.MathUtils.lerp(
      this.voiceStrength,
      boostedVoice,
      delta * 10
    )

    //------------------------------------------------
    // Energy
    //------------------------------------------------

    this.energy = THREE.MathUtils.lerp(
      this.energy,
      this.voiceStrength,
      delta * 5
    )

    //------------------------------------------------
    // Animate every node
    //------------------------------------------------

    neuralGraph.nodes.forEach((node) => {
      const direction =
        node.originalPosition.clone().normalize()

      const idleRadius =
        node.originalPosition.length() * 1.05

      const talkingRadius =
        node.originalPosition.length() * 1.7

      const targetRadius =
        THREE.MathUtils.lerp(
          idleRadius,
          talkingRadius,
          this.voiceStrength
        )

      const target =
        direction.multiplyScalar(targetRadius)

      node.position.lerp(target, delta * 6)

      node.energy = THREE.MathUtils.lerp(
        node.energy,
        this.energy,
        delta * 8
      )

      node.pulse +=
        delta *
        (0.6 + this.voiceStrength * 4)

      node.brightness =
        0.7 +
        node.energy * 0.3 +
        Math.sin(node.pulse) * 0.05
    })
  }
}

export const neuralAnimation =
  new NeuralAnimation()