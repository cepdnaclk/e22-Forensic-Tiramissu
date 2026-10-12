---
layout: home
permalink: index.html

# Repository and Project Details
repository-name: e22-co226-project-template
title: Project Forensa - Forensic Medical Case Management System
---

# Project Forensa - Forensic Medical Case Management System

---

## Team
- E/22/001, H.M.H.N. Aberathna, [e22001@eng.pdn.ac.lk](mailto:e22001@eng.pdn.ac.lk)
- E/22/027, M.A.N.P. Anawarathne, [e22027@eng.pdn.ac.lk](mailto:e22027@eng.pdn.ac.lk)
- E/22/120, A.S.V. Gunasiri, [e22120@eng.pdn.ac.lk](mailto:e22120@eng.pdn.ac.lk)
- E/22/324, P.H.D. Rathnasiri, [e22324@eng.pdn.ac.lk](mailto:e22324@eng.pdn.ac.lk)

---

## Table of Contents
1. [Introduction](#introduction)
2. [Problem Statement & Solution](#problem-statement--solution)
3. [Key Features](#key-features)
4. [System Architecture & Technology Stack](#system-architecture--technology-stack)
5. [Database Design & Schema](#database-design--schema)
6. [Testing & Quality Assurance](#testing--quality-assurance)
7. [Future Enhancements](#future-enhancements)
8. [Links](#links)

---

## Introduction

Forensic medical departments play a critical role in supporting healthcare and judicial systems by conducting medico-legal examinations, managing forensic cases, collecting evidence, and preparing authoritative reports for legal proceedings. 

**Project Forensa** is a web-based Forensic Medical Case Management System designed to digitalize and centralize forensic medical operations. Developed for **CO2050 - Database Systems**, the platform provides a centralized, secure relational database solution for managing patient records, forensic cases, postmortem details, laboratory tests, evidence chain-of-custody, and court report submissions.

---

## Problem Statement & Solution

### The Real-World Problem
Traditional forensic medical units often rely on paper-based records or fragmented, unintegrated digital systems. This approach leads to several key challenges:
* **Slow Data Retrieval:** Manual searching across multiple registers delays legal and medical investigations.
* **Risk of Data Loss & Corruption:** Physical documents are vulnerable to loss, damage, and duplication errors.
* **Traceability & Security Issues:** Lack of proper access control exposes sensitive medico-legal records and makes tracking evidence custody difficult.
* **Inefficient Reporting:** Manual preparation of medico-legal and court reports is time-consuming and prone to human error.

### Proposed Solution & Impact
Project Forensa introduces a centralized, role-based database platform that digitizes the entire forensic investigation lifecycle. 
* **Centralized Digital Database:** Eliminates paper dependencies and data duplication.
* **Role-Based Access Control (RBAC):** Restricts system access based on user privileges (JMOs, Doctors, Lab Technicians, Evidence Officers, Administrators).
* **Enhanced Traceability:** Tracks evidence transfers with automated chain-of-custody logging.
* **Automated Medico-Legal Reporting:** Generates instant daily, monthly, court, and statistical reports in PDF format.

---

## Key Features

* **Patient & Case Management:** Seamless registration, tracking, and linking of patient histories with active forensic cases.
* **Postmortem & Examination Logging:** Comprehensive records for postmortem findings, injury documentations, and cause of death determination.
* **Evidence & Chain of Custody Tracking:** Real-time evidence logging, sample tracking, and transfer records to maintain evidence integrity.
* **Laboratory Operations:** Automated logging of lab test requests, specimen processing, and result submissions.
* **Court Report Module:** Streamlined creation, digital signing, and status monitoring of medico-legal court reports.
* **Audit Logging & Security:** Detailed tracking of all database write/update operations for complete accountability.

---

## System Architecture & Technology Stack

Project Forensa follows a modern 3-tier web application architecture:
