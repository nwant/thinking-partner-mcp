export function createTools(storage) {
  return {
    async set_focus({ topic, context = '', tool }) {
      const focus = await storage.setCurrentFocus({
        topic,
        context,
        tool,
        status: 'active'
      });
      
      return {
        success: true,
        message: `Focus set to: ${topic}`,
        focus
      };
    },

    async get_context({ tool, scope = 'current' }) {
      const context = await storage.getContextForTool(tool, scope);
      
      return {
        success: true,
        context,
        message: `Context retrieved for ${tool}`
      };
    },

    async log_design_decision({ decision, reasoning, alternatives = [], topic }) {
      const decisionRecord = await storage.addDecision({
        decision,
        reasoning,
        alternatives,
        topic: topic || (await storage.getCurrentFocus())?.topic,
        source: 'desktop'
      });
      
      return {
        success: true,
        message: 'Design decision logged',
        decision: decisionRecord
      };
    },

    async log_implementation_finding({ finding, code_context = '', topic }) {
      const discovery = await storage.addDiscovery({
        finding,
        code_context,
        topic: topic || (await storage.getCurrentFocus())?.topic,
        source: 'code'
      });
      
      return {
        success: true,
        message: 'Implementation finding logged',
        discovery
      };
    },

    async bridge_conversation({ from_tool, to_tool, summary, open_questions = [] }) {
      const bridge = await storage.addBridge({
        from_tool,
        to_tool,
        summary,
        open_questions,
        focus_topic: (await storage.getCurrentFocus())?.topic
      });
      
      return {
        success: true,
        message: `Conversation bridged from ${from_tool} to ${to_tool}`,
        bridge
      };
    }
  };
}
