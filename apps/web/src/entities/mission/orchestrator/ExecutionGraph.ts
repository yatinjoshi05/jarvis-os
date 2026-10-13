import type { AgentCapability } from '../agents/IAgent'

export interface ExecutionNode {
  id: string
  stageId: string
  name: string
  description: string
  dependencies: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  requiredCapability: AgentCapability
  retryCount: number
}

export class ExecutionGraph {
  private nodes = new Map<string, ExecutionNode>()

  public addNode(node: ExecutionNode): void {
    this.nodes.set(node.id, node)
  }

  public getNode(id: string): ExecutionNode | undefined {
    return this.nodes.get(id)
  }

  public getAllNodes(): ExecutionNode[] {
    return Array.from(this.nodes.values())
  }

  /**
   * Returns all pending nodes whose prerequisites/dependencies are fully satisfied.
   */
  public getExecutableNodes(): ExecutionNode[] {
    const executable: ExecutionNode[] = []

    for (const node of this.nodes.values()) {
      if (node.status !== 'pending') continue

      const dependenciesSatisfied = node.dependencies.every((depId) => {
        const depNode = this.nodes.get(depId)
        return depNode && depNode.status === 'completed'
      })

      if (dependenciesSatisfied) {
        executable.push(node)
      }
    }

    return executable
  }

  public markInProgress(id: string): void {
    const node = this.nodes.get(id)
    if (node) node.status = 'in_progress'
  }

  public markCompleted(id: string): void {
    const node = this.nodes.get(id)
    if (node) node.status = 'completed'
  }

  public markFailed(id: string): void {
    const node = this.nodes.get(id)
    if (node) {
      node.status = 'failed'
      node.retryCount++
    }
  }

  public isComplete(): boolean {
    for (const node of this.nodes.values()) {
      if (node.status !== 'completed') return false
    }
    return true
  }

  public hasFailedNodes(): boolean {
    for (const node of this.nodes.values()) {
      if (node.status === 'failed') return true
    }
    return false
  }

  public clear(): void {
    this.nodes.clear()
  }
}
