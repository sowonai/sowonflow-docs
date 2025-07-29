# Custom Nodes Guide

## Overview

SowonFlow's custom nodes are a powerful feature that allows you to implement complex business logic that cannot be implemented with agent or basic node types. With custom nodes, developers can insert special processing logic into workflows and extend workflows with complete control.

## Understanding Custom Nodes

### What is a Custom Node?
A custom node is a node implemented with a handler function defined by the user:

- **Complete Control**: Full read/write permissions for workflow state
- **Asynchronous Support**: External API calls, file processing, complex calculations, etc.
- **Flexible Input/Output**: Message, state variable, custom data processing
- **Parallel Processing Com