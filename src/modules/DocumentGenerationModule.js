/**
 * Document Generation Module
 * 
 * This module leverages Large Language Models to automatically generate
 * tailored bid documents based on opportunity requirements and company profiles.
 * 
 * Features:
 * - AI-powered bid document generation
 * - Template-based document structure
 * - Company strength highlighting
 * - Requirement compliance validation
 * - Automatic document formatting
 * - Multi-language support
 */

const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');
const docx = require('docx');
const pdf = require('pdf-lib');
const handlebars = require('handlebars');
const logger = require('../utils/logger');

class DocumentGenerationModule {
  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Initialize template cache
    this.templateCache = new Map();
    
    // Document type handlers
    this.formatters = {
      docx: this.formatDocx.bind(this),
      pdf: this.formatPdf.bind(this),
      html: this.formatHtml.bind(this),
      markdown: this.formatMarkdown.bind(this),
      plain: this.formatPlainText.bind(this)
    };
    
    // Load document templates
    this.loadTemplates();
    
    logger.info('Document Generation Module initialized');
  }
  
  /**
   * Load document templates from filesystem
   */
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../../templates');
      const templates = await fs.readdir(templatesDir);
      
      for (const template of templates) {
        if (template.endsWith('.hbs') || template.endsWith('.template')) {
          const templateName = path.basename(template, path.extname(template));
          const templatePath = path.join(templatesDir, template);
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          
          // Compile and cache the template
          this.templateCache.set(templateName, handlebars.compile(templateContent));
          logger.debug(`Loaded template: ${templateName}`);
        }
      }
      
      logger.info(`Loaded ${this.templateCache.size} document templates`);
    } catch (error) {
      logger.error('Error loading document templates:', error);
    }
  }
  
  /**
   * Generate a bid document based on opportunity, company profile, and analysis
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile data
   * @param {Object} analysis - Analysis results from AIAnalysisModule
   * @param {Object} options - Generation options
   * @returns {Object} - Generated document
   */
  async generateBidDocument(opportunity, companyProfile, analysis, options = {}) {
    logger.info(`Generating bid document for opportunity: ${opportunity.id}`);
    
    try {
      // Set default options
      const documentOptions = {
        template: options.template || 'standard_rfp_response',
        format: options.format || 'docx',
        language: options.language || 'en',
        emphasizeStrengths: options.emphasizeStrengths !== false,
        includeExamples: options.includeExamples !== false,
        includeAnalysis: options.includeAnalysis !== false,
        customSections: options.customSections || []
      };
      
      // Generate document content using AI
      const documentContent = await this.generateDocumentContent(
        opportunity, 
        companyProfile, 
        analysis, 
        documentOptions
      );
      
      // Apply the selected template
      const formattedContent = await this.applyTemplate(
        documentContent, 
        documentOptions.template
      );
      
      // Format the document in the requested output format
      const document = await this.formatDocument(
        formattedContent, 
        documentOptions.format,
        opportunity,
        companyProfile
      );
      
      logger.info(`Document generation successful for opportunity: ${opportunity.id}`);
      return document;
    } catch (error) {
      logger.error(`Error generating bid document for opportunity ${opportunity.id}:`, error);
      throw new Error('Failed to generate bid document');
    }
  }
  
  /**
   * Generate document content using Large Language Model
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @param {Object} analysis - Analysis results
   * @param {Object} options - Generation options
   * @returns {Object} - Document content sections
   */
  async generateDocumentContent(opportunity, companyProfile, analysis, options) {
    logger.debug('Generating document content with LLM');
    
    try {
      // Prepare system prompt for the LLM
      const systemPrompt = this.createSystemPrompt(opportunity, companyProfile, analysis, options);
      
      // Execute LLM call to generate document content
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate a high-quality bid document for the opportunity titled "${opportunity.title}" for ${companyProfile.name}.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });
      
      // Parse the response
      const content = JSON.parse(response.choices[0].message.content);
      
      // Validate the generated content
      this.validateGeneratedContent(content, opportunity);
      
      // Add metadata
      content.metadata = {
        generatedAt: new Date().toISOString(),
        opportunityId: opportunity.id,
        companyId: companyProfile.id,
        template: options.template,
        format: options.format,
        language: options.language
      };
      
      return content;
    } catch (error) {
      logger.error('Error generating document content with LLM:', error);
      
      // Fallback to template-based generation if LLM fails
      return this.generateFallbackContent(opportunity, companyProfile, analysis, options);
    }
  }
  
  /**
   * Create a system prompt for the LLM
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @param {Object} analysis - Analysis results
   * @param {Object} options - Generation options
   * @returns {string} - System prompt
   */
  createSystemPrompt(opportunity, companyProfile, analysis, options) {
    return `
      You are an expert in creating high-quality bid documents for government procurement opportunities.
      Your task is to generate a comprehensive and persuasive bid document for the following opportunity:
      
      OPPORTUNITY DETAILS:
      Title: ${opportunity.title}
      ID: ${opportunity.id}
      Agency: ${opportunity.agency}
      Description: ${opportunity.description}
      Value: ${opportunity.value || 'Not specified'}
      Close Date: ${opportunity.closeDate || 'Not specified'}
      Category: ${opportunity.category || 'Not specified'}
      
      COMPANY PROFILE:
      Name: ${companyProfile.name}
      Description: ${companyProfile.description}
      Years in Business: ${companyProfile.yearsInBusiness || 'Not specified'}
      Annual Revenue: ${companyProfile.annualRevenue || 'Not specified'}
      Employee Count: ${companyProfile.employeeCount || 'Not specified'}
      Expertise Categories: ${(companyProfile.expertiseCategories || []).join(', ')}
      Past Clients: ${(companyProfile.pastClients || []).join(', ')}
      
      ANALYSIS HIGHLIGHTS:
      Success Probability: ${analysis.successProbability * 100}%
      Key Strengths: ${(analysis.strategicAdvantages || []).map(a => a.description).join(', ')}
      Competitive Positioning: ${analysis.competitiveAnalysis?.competitiveDynamics || 'Not analyzed'}
      
      DOCUMENT REQUIREMENTS:
      - Create a comprehensive bid document with all standard sections
      - ${options.emphasizeStrengths ? 'Emphasize company strengths that align with the opportunity' : 'Present a balanced view of company capabilities'}
      - ${options.includeExamples ? 'Include relevant past performance examples' : 'Focus on capabilities rather than past examples'}
      - Language: ${options.language === 'en' ? 'English' : options.language}
      - Structure the document with clear sections and subsections
      - Ensure compliance with all opportunity requirements
      - Be professional, precise, and persuasive
      
      CUSTOM INSTRUCTIONS:
      ${options.customInstructions || 'No custom instructions provided.'}
      
      OUTPUT FORMAT:
      Return a JSON object with the following sections:
      - executive_summary: A comprehensive summary of the proposal
      - company_overview: Background and capabilities of the company
      - approach: Proposed approach to meeting requirements
      - technical_solution: Technical details of the proposed solution
      - management_approach: How the project will be managed
      - past_performance: Relevant past projects and outcomes
      - pricing: Pricing strategy and justification
      - compliance_matrix: How the proposal meets all requirements
      - appendices: Additional supporting information
      
      Each section should be comprehensive and ready for inclusion in a formal bid document.
    `;
  }
  
  /**
   * Validate the content generated by the LLM
   * @param {Object} content - Generated content
   * @param {Object} opportunity - Opportunity data
   */
  validateGeneratedContent(content, opportunity) {
    // Check for required sections
    const requiredSections = [
      'executive_summary',
      'company_overview',
      'approach',
      'technical_solution',
      'management_approach',
      'past_performance',
      'pricing'
    ];
    
    for (const section of requiredSections) {
      if (!content[section] || content[section].trim() === '') {
        logger.warn(`Generated content missing required section: ${section}`);
        content[section] = `[This ${section.replace('_', ' ')} section needs to be completed]`;
      }
    }
    
    // Check for opportunity-specific requirements
    if (opportunity.requirements && opportunity.requirements.length > 0) {
      if (!content.compliance_matrix) {
        content.compliance_matrix = {};
      }
      
      for (const req of opportunity.requirements) {
        if (!content.compliance_matrix[req.id]) {
          logger.warn(`Generated content missing compliance for requirement: ${req.id}`);
          content.compliance_matrix[req.id] = `[Compliance response for ${req.id} needs to be completed]`;
        }
      }
    }
  }
  
  /**
   * Generate fallback content when LLM generation fails
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @param {Object} analysis - Analysis results
   * @param {Object} options - Generation options
   * @returns {Object} - Document content sections
   */
  generateFallbackContent(opportunity, companyProfile, analysis, options) {
    logger.debug('Using fallback content generation');
    
    return {
      executive_summary: this.generateFallbackExecutiveSummary(opportunity, companyProfile),
      company_overview: this.generateFallbackCompanyOverview(companyProfile),
      approach: `[Approach to addressing ${opportunity.title}]`,
      technical_solution: `[Technical solution for ${opportunity.title}]`,
      management_approach: `[Management approach for ${opportunity.title}]`,
      past_performance: this.generateFallbackPastPerformance(companyProfile),
      pricing: `[Pricing proposal for ${opportunity.title}]`,
      compliance_matrix: this.generateFallbackComplianceMatrix(opportunity),
      appendices: `[Appendices for ${opportunity.title}]`,
      metadata: {
        generatedAt: new Date().toISOString(),
        opportunityId: opportunity.id,
        companyId: companyProfile.id,
        template: options.template,
        format: options.format,
        language: options.language,
        generationMethod: 'fallback'
      }
    };
  }
  
  /**
   * Generate fallback executive summary
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {string} - Executive summary content
   */
  generateFallbackExecutiveSummary(opportunity, companyProfile) {
    return `${companyProfile.name} is pleased to submit this proposal in response to ${opportunity.agency}'s Request for Proposal for "${opportunity.title}". 
    
With ${companyProfile.yearsInBusiness || 'many'} years of experience in the industry and a proven track record of successful projects, our team is well-positioned to deliver exceptional results for this project. 

Our approach combines industry best practices, innovative solutions, and a dedicated team of professionals to ensure the project meets all requirements and exceeds expectations. We understand the challenges involved and have developed a comprehensive strategy to address them effectively.

We are committed to delivering this project on time and within budget while maintaining the highest standards of quality. Our team looks forward to the opportunity to work with ${opportunity.agency} on this important initiative.`;
  }
  
  /**
   * Generate fallback company overview
   * @param {Object} companyProfile - Company profile
   * @returns {string} - Company overview content
   */
  generateFallbackCompanyOverview(companyProfile) {
    return `${companyProfile.name} is a ${companyProfile.description || 'leading provider in the industry'}.
    
Founded ${companyProfile.yearFounded ? `in ${companyProfile.yearFounded}` : 'many years ago'}, our company has grown to employ ${companyProfile.employeeCount || 'numerous'} professionals and achieve an annual revenue of ${companyProfile.annualRevenue || 'substantial market presence'}.

Our core expertise includes ${(companyProfile.expertiseCategories || ['industry expertise']).join(', ')}, allowing us to deliver exceptional solutions to our clients. We have successfully served a diverse range of clients, including ${(companyProfile.pastClients || ['various organizations']).slice(0, 5).join(', ')}.

Our mission is to provide innovative, efficient, and effective solutions that help our clients achieve their objectives and overcome their challenges. We are committed to excellence, integrity, and customer satisfaction in everything we do.`;
  }
  
  /**
   * Generate fallback past performance
   * @param {Object} companyProfile - Company profile
   * @returns {string} - Past performance content
   */
  generateFallbackPastPerformance(companyProfile) {
    const pastProjects = companyProfile.pastProjects || [];
    
    if (pastProjects.length === 0) {
      return `${companyProfile.name} has a strong track record of successful project delivery. However, specific past performance examples are not available at this time.`;
    }
    
    let content = `${companyProfile.name} has successfully completed numerous projects similar to this opportunity. Below are some relevant examples of our past performance:\n\n`;
    
    pastProjects.slice(0, 3).forEach((project, index) => {
      content += `Project ${index + 1}: ${project.title || 'Relevant Project'}\n`;
      content += `Client: ${project.client || 'Client name'}\n`;
      content += `Value: ${project.value || 'Not specified'}\n`;
      content += `Duration: ${project.duration || 'Not specified'}\n`;
      content += `Description: ${project.description || 'Project description not available.'}\n`;
      content += `Outcome: ${project.outcome || 'Successfully completed project meeting all requirements.'}\n\n`;
    });
    
    return content;
  }
  
  /**
   * Generate fallback compliance matrix
   * @param {Object} opportunity - Opportunity data
   * @returns {Object} - Compliance matrix
   */
  generateFallbackComplianceMatrix(opportunity) {
    const matrix = {};
    
    if (opportunity.requirements && opportunity.requirements.length > 0) {
      opportunity.requirements.forEach(req => {
        matrix[req.id] = `${req.description}: Our solution complies with this requirement.`;
      });
    } else {
      matrix['general_compliance'] = 'Our solution fully complies with all requirements specified in the RFP.';
    }
    
    return matrix;
  }
  
  /**
   * Apply a template to the document content
   * @param {Object} content - Document content
   * @param {string} templateName - Template name
   * @returns {string} - Formatted content
   */
  async applyTemplate(content, templateName) {
    logger.debug(`Applying template: ${templateName}`);
    
    try {
      // Check if template exists
      if (!this.templateCache.has(templateName)) {
        logger.warn(`Template ${templateName} not found, falling back to default template`);
        templateName = 'standard_rfp_response';
        
        // If still not found, create a simple default template
        if (!this.templateCache.has(templateName)) {
          logger.warn('Default template not found, using built-in template');
          return this.applyBuiltInTemplate(content);
        }
      }
      
      // Apply the template
      const template = this.templateCache.get(templateName);
      return template(content);
    } catch (error) {
      logger.error(`Error applying template ${templateName}:`, error);
      // Fall back to built-in template
      return this.applyBuiltInTemplate(content);
    }
  }
  
  /**
   * Apply a built-in template when template file is unavailable
   * @param {Object} content - Document content
   * @returns {string} - Formatted content
   */
  applyBuiltInTemplate(content) {
    return `
# ${content.metadata ? `Proposal for ${content.metadata.opportunityId}` : 'Proposal'}

## Executive Summary

${content.executive_summary || ''}

## Company Overview

${content.company_overview || ''}

## Approach

${content.approach || ''}

## Technical Solution

${content.technical_solution || ''}

## Management Approach

${content.management_approach || ''}

## Past Performance

${content.past_performance || ''}

## Pricing

${content.pricing || ''}

## Compliance Matrix

${Object.entries(content.compliance_matrix || {}).map(([key, value]) => `* ${key}: ${value}`).join('\n')}

## Appendices

${content.appendices || ''}
`;
  }
  
  /**
   * Format the document in the requested output format
   * @param {string} content - Formatted content
   * @param {string} format - Output format
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {Object} - Formatted document
   */
  async formatDocument(content, format, opportunity, companyProfile) {
    logger.debug(`Formatting document as ${format}`);
    
    try {
      // Check if formatter exists for the format
      if (!this.formatters[format]) {
        logger.warn(`Formatter for ${format} not found, falling back to plain text`);
        format = 'plain';
      }
      
      // Format the document
      const document = await this.formatters[format](content, opportunity, companyProfile);
      
      return {
        content: document,
        format,
        metadata: {
          generatedAt: new Date().toISOString(),
          opportunityId: opportunity.id,
          companyId: companyProfile.id,
          format
        }
      };
    } catch (error) {
      logger.error(`Error formatting document as ${format}:`, error);
      // Fall back to plain text
      return {
        content: content,
        format: 'plain',
        metadata: {
          generatedAt: new Date().toISOString(),
          opportunityId: opportunity.id,
          companyId: companyProfile.id,
          format: 'plain',
          fallback: true
        }
      };
    }
  }
  
  /**
   * Format document as DOCX
   * @param {string} content - Formatted content
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {Buffer} - DOCX document
   */
  async formatDocx(content, opportunity, companyProfile) {
    // Parse markdown content
    const sections = this.parseMarkdownSections(content);
    
    // Create docx document
    const doc = new docx.Document({
      title: `Proposal for ${opportunity.title}`,
      description: `Bid document for ${opportunity.title} by ${companyProfile.name}`,
      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 28,
              bold: true,
              color: "2E74B5"
            },
            paragraph: {
              spacing: {
                after: 120
              }
            }
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 24,
              bold: true,
              color: "2E74B5"
            },
            paragraph: {
              spacing: {
                before: 240,
                after: 120
              }
            }
          }
        ]
      }
    });
    
    // Create document sections
    const docSections = [];
    
    // Cover page
    docSections.push(
      new docx.Paragraph({
        text: `Proposal for: ${opportunity.title}`,
        heading: docx.HeadingLevel.HEADING_1,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        text: `Submitted by: ${companyProfile.name}`,
        alignment: docx.AlignmentType.CENTER,
        spacing: {
          after: 400
        }
      }),
      new docx.Paragraph({
        text: `Submitted to: ${opportunity.agency}`,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        text: `Date: ${new Date().toLocaleDateString()}`,
        alignment: docx.AlignmentType.CENTER,
        spacing: {
          after: 400
        }
      }),
      new docx.Paragraph({
        text: `Opportunity ID: ${opportunity.id}`,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        text: `Closing Date: ${new Date(opportunity.closeDate).toLocaleDateString()}`,
        alignment: docx.AlignmentType.CENTER
      }),
      new docx.Paragraph({
        children: [
          new docx.PageBreak()
        ]
      })
    );
    
    // Table of contents
    docSections.push(
      new docx.Paragraph({
        text: "Table of Contents",
        heading: docx.HeadingLevel.HEADING_1
      }),
      ...Object.keys(sections).map((sectionKey, index) => {
        return new docx.Paragraph({
          text: `${index + 1}. ${this.formatSectionTitle(sectionKey)}`,
          spacing: {
            after: 120
          }
        });
      }),
      new docx.Paragraph({
        children: [
          new docx.PageBreak()
        ]
      })
    );
    
    // Content sections
    Object.entries(sections).forEach(([sectionKey, sectionContent], index) => {
      docSections.push(
        new docx.Paragraph({
          text: `${index + 1}. ${this.formatSectionTitle(sectionKey)}`,
          heading: docx.HeadingLevel.HEADING_1
        })
      );
      
      // Split section content into paragraphs
      const paragraphs = sectionContent.split('\n\n');
      
      paragraphs.forEach(para => {
        if (para.trim() !== '') {
          docSections.push(
            new docx.Paragraph({
              text: para.trim(),
              spacing: {
                after: 120
              }
            })
          );
        }
      });
      
      // Add page break after each section except the last one
      if (index < Object.keys(sections).length - 1) {
        docSections.push(
          new docx.Paragraph({
            children: [
              new docx.PageBreak()
            ]
          })
        );
      }
    });
    
    doc.addSection({
      children: docSections
    });
    
    // Generate document buffer
    return await docx.Packer.toBuffer(doc);
  }
  
  /**
   * Format document as PDF
   * @param {string} content - Formatted content
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {Buffer} - PDF document
   */
  async formatPdf(content, opportunity, companyProfile) {
    // Create PDF document
    const pdfDoc = await pdf.PDFDocument.create();
    
    // Add metadata
    pdfDoc.setTitle(`Proposal for ${opportunity.title}`);
    pdfDoc.setAuthor(companyProfile.name);
    pdfDoc.setSubject(`Bid for ${opportunity.title}`);
    pdfDoc.setKeywords([opportunity.category, 'proposal', 'bid', companyProfile.name]);
    
    // Add content
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    
    // Add title
    page.drawText(`Proposal for ${opportunity.title}`, {
      x: 50,
      y: height - 50,
      size: 24
    });
    
    // Add company name
    page.drawText(`Submitted by: ${companyProfile.name}`, {
      x: 50,
      y: height - 100,
      size: 16
    });
    
    // Simple implementation - in production would use more sophisticated PDF generation
    // with proper layout, formatting, images, etc.
    page.drawText("This is a generated PDF proposal. For full content, please use the DOCX format.", {
      x: 50,
      y: height - 150,
      size: fontSize,
      maxWidth: width - 100
    });
    
    // Save document
    return await pdfDoc.save();
  }
  
  /**
   * Format document as HTML
   * @param {string} content - Formatted content
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {string} - HTML document
   */
  async formatHtml(content, opportunity, companyProfile) {
    // Parse markdown content
    const sections = this.parseMarkdownSections(content);
    
    // Basic HTML template
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposal for ${opportunity.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    .cover-page {
      text-align: center;
      margin-bottom: 50px;
    }
    .cover-page h1 {
      color: #2E74B5;
      font-size: 28px;
      margin-bottom: 30px;
    }
    .cover-page p {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .section {
      margin-bottom: 30px;
    }
    h2 {
      color: #2E74B5;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    .toc {
      background-color: #f8f8f8;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    .toc ul {
      list-style-type: none;
      padding-left: 10px;
    }
    .toc li {
      margin-bottom: 10px;
    }
    .toc a {
      text-decoration: none;
      color: #2E74B5;
    }
    .toc a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <h1>Proposal for: ${opportunity.title}</h1>
    <p>Submitted by: ${companyProfile.name}</p>
    <p>Submitted to: ${opportunity.agency}</p>
    <p>Date: ${new Date().toLocaleDateString()}</p>
    <p>Opportunity ID: ${opportunity.id}</p>
    <p>Closing Date: ${new Date(opportunity.closeDate).toLocaleDateString()}</p>
  </div>
  
  <div class="toc">
    <h2>Table of Contents</h2>
    <ul>
      ${Object.keys(sections).map((sectionKey, index) => {
        return `<li><a href="#section-${index + 1}">${index + 1}. ${this.formatSectionTitle(sectionKey)}</a></li>`;
      }).join('\n      ')}
    </ul>
  </div>
  
  ${Object.entries(sections).map(([sectionKey, sectionContent], index) => {
    return `
  <div class="section" id="section-${index + 1}">
    <h2>${index + 1}. ${this.formatSectionTitle(sectionKey)}</h2>
    ${sectionContent.split('\n\n').map(para => {
      if (para.trim() !== '') {
        return `<p>${para.trim()}</p>`;
      }
      return '';
    }).join('\n    ')}
  </div>`;
  }).join('\n  ')}
</body>
</html>
`;
    
    return html;
  }
  
  /**
   * Format document as Markdown
   * @param {string} content - Formatted content
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {string} - Markdown document
   */
  async formatMarkdown(content, opportunity, companyProfile) {
    // Add header information
    const header = `# Proposal for: ${opportunity.title}

*Submitted by:* ${companyProfile.name}  
*Submitted to:* ${opportunity.agency}  
*Date:* ${new Date().toLocaleDateString()}  
*Opportunity ID:* ${opportunity.id}  
*Closing Date:* ${new Date(opportunity.closeDate).toLocaleDateString()}  

## Table of Contents

`;
    
    // Parse and add table of contents
    const sections = this.parseMarkdownSections(content);
    const toc = Object.keys(sections).map((sectionKey, index) => {
      return `${index + 1}. [${this.formatSectionTitle(sectionKey)}](#${sectionKey.toLowerCase().replace(/_/g, '-')})`;
    }).join('\n');
    
    return header + toc + '\n\n' + content;
  }
  
  /**
   * Format document as plain text
   * @param {string} content - Formatted content
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {string} - Plain text document
   */
  async formatPlainText(content, opportunity, companyProfile) {
    // Add header information
    const header = `PROPOSAL FOR: ${opportunity.title.toUpperCase()}

Submitted by: ${companyProfile.name}
Submitted to: ${opportunity.agency}
Date: ${new Date().toLocaleDateString()}
Opportunity ID: ${opportunity.id}
Closing Date: ${new Date(opportunity.closeDate).toLocaleDateString()}

TABLE OF CONTENTS
`;
    
    // Parse and add table of contents
    const sections = this.parseMarkdownSections(content);
    const toc = Object.keys(sections).map((sectionKey, index) => {
      return `${index + 1}. ${this.formatSectionTitle(sectionKey)}`;
    }).join('\n');
    
    // Replace markdown formatting with plain text
    let plainContent = content
      .replace(/^# (.*)/gm, '$1\n' + '='.repeat(80))
      .replace(/^## (.*)/gm, '$1\n' + '-'.repeat(80))
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');
    
    return header + toc + '\n\n' + plainContent;
  }
  
  /**
   * Parse markdown sections
   * @param {string} content - Markdown content
   * @returns {Object} - Sections with content
   */
  parseMarkdownSections(content) {
    const sections = {};
    let currentSection = null;
    let currentContent = [];
    
    // Split content into lines
    const lines = content.split('\n');
    
    // Process each line
    for (const line of lines) {
      // Check if line is a section header
      const sectionMatch = line.match(/^## (.+)$/);
      
      if (sectionMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n');
          currentContent = [];
        }
        
        // Start new section
        currentSection = this.normalizeSectionKey(sectionMatch[1]);
      } else if (currentSection) {
        // Add content to current section
        currentContent.push(line);
      }
    }
    
    // Save last section
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n');
    }
    
    return sections;
  }
  
  /**
   * Format section title for display
   * @param {string} sectionKey - Section key
   * @returns {string} - Formatted title
   */
  formatSectionTitle(sectionKey) {
    return sectionKey
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Normalize section key
   * @param {string} title - Section title
   * @returns {string} - Normalized key
   */
  normalizeSectionKey(title) {
    return title
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }
  
  /**
   * Generate a section of compliance response
   * @param {Object} requirement - Requirement object
   * @param {Object} companyProfile - Company profile
   * @returns {string} - Compliance response
   */
  generateComplianceResponse(requirement, companyProfile) {
    return `${companyProfile.name} fully complies with the requirement: ${requirement.description}. 
    
Our solution addresses this requirement through our proven approach and technical capabilities. We have successfully implemented similar requirements in past projects and will apply the same expertise to meet this requirement effectively.`;
  }
}

module.exports = DocumentGenerationModule;
