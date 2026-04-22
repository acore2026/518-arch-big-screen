# Canonical Naming Model

This document defines the canonical language for the current dashboard so change requests can be precise and unambiguous.

## Naming Rule

Use this pattern when asking for a change:

`Region > Section > Component`

Examples:

- `Right Panel > UE STATE > Current Policy`
- `Center Workspace > Topology Canvas > TRF (Tools)`
- `Left Sidebar > Topology Explorer > UERANSIM`
- `Top Header > UE Selector Placement Toggle`

## Layout Map

The page has 4 primary regions:

1. `Top Header`
2. `Left Sidebar`
3. `Center Workspace`
4. `Right Panel`

## 1. Top Header

The dark bar across the top.

Components:

- `Product Badge`
- `KPI Strip`
- `UE Selector Placement Toggle`
- `Header UE Selector`
- `Clock`

## 2. Left Sidebar

The left navigation column.

Sections:

- `Topology Explorer`
- `TRF Tool Registry`

Inside `Topology Explorer`, use these names:

- `PLMN 001-01`
- `Decoupled Core`
- `AI Control Layer`
- `6G NFs`
- `UERANSIM`
- `UE Targets` (only when sidebar selector placement is active)

## 3. Center Workspace

The middle area has two parts:

- `Topology Canvas`
- `SBI Trace Table`

Inside `Topology Canvas`, use:

- `Device / RAN Sim`
- `SRF Router`
- `System Agent`
- `Conn Agent`
- `Compute Agent`
- `TRF (Tools)`
- `ARF (Agents)`
- `6G NFs (Tool Hosts)`

Pop-ups opened from the canvas:

- `TRF Tool Registry Overlay`
- `ARF Agent Registry Overlay`
- `Tool Definition Modal`

## 4. Right Panel

The right-side tabbed panel.

Tabs:

- `INTENT`
- `REACT LOG`
- `UE STATE`
- `NGAP`
- `INFRA`
- `TRACE SESSIONS`

Use these canonical names inside tabs:

- `INTENT > Target UE`
- `INTENT > Natural Language Request`
- `INTENT > Action Row`
- `INTENT > Semi-Structured Intent`
- `UE STATE > Active UE`
- `UE STATE > Identification`
- `UE STATE > Status & Location`
- `UE STATE > Active PDU Sessions`
- `UE STATE > Current Policy`
- `UE STATE > Live Service Metrics`
- `TRACE SESSIONS > Session List`

## Preferred Request Style

Good examples:

- `Change Right Panel > UE STATE > Live Service Metrics`
- `Restyle Center Workspace > Topology Canvas > System Agent`
- `Move Left Sidebar > UE Targets below UERANSIM`
- `Update Right Panel > INTENT > Action Row`

Avoid vague references like `the box on the right` or `the middle node` unless the target is already clear from context.
