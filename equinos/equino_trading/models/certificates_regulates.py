# -*- coding: utf-8 -*-

from odoo import models, fields, api, exceptions

import logging
_logger = logging.getLogger(__name__)

class certificates_regulates(models.Model):
    _name = 'certificates.regulates'
    _description = 'Certifications Regulations'
    
    name = fields.Char(string='Name')
    
    file_name = fields.Char(string='Name')
    file = fields.Binary(string='File', filename=file_name)
    
    
    service_type = fields.Selection(string='Service Type', selection=[['export','Export'],['import','Import']])
    type = fields.Selection(string='Service Type', default='binary', selection=[['binary','File'],['project','Project Check List']])
    cr_crm_lead_id = fields.One2many('crm.lead', string='Folder', inverse_name="certificates_regulates_ids")
    folder_id = fields.Many2one('certificates.regulates.folders', string='Folder', inverse_name="certificates_regulates_ids")
    project_id = fields.Many2one('project.project', string='Project', inverse_name="certificates_regulates_ids")
    is_trading_template = fields.Boolean(string='Template', related='project_id.is_trading_template')
    
    def action_create_empty_staged_project(self):
        new_project = self.env['project.project'].sudo().create({
                                                                    'name': str(self.name),
                                                                    'is_trading_template': False,                                    
                                                                })
        self.project_id = new_project
        return new_project        
    
    def action_create_project_from_template(self):
        new_project = self.project_id.copy()
        new_project.sudo().update({
                                    'name': str(self.project_id.name),
                                    'is_trading_template': False,                                    
                                  })
        self.project_id = new_project
        return new_project  

class certificates_regulates_folders(models.Model):
    _name = 'certificates.regulates.folders'
    _description = 'Certifications Regulations Folders'

    name = fields.Char(string='Name')
    certificates_regulates_ids = fields.One2many('certificates.regulates', string='Documents', inverse_name="folder_id")
    crf_crm_lead_id = fields.One2many('crm.lead', string='CRM Leads', inverse_name="certificates_regulates_folders_ids")

    
    @api.model
    def default_get(self, vals):
        rec = super(certificates_regulates_folders, self).default_get(vals)
        active_id =  self.env.context.get('active_id')
        active_lead = self.env['crm.lead'].browse(self._context['active_id'])
        # crm_leads = self.env['crm.lead'].search([('id','=', active_id) ])
        # _logger.info("SIT     product_get : %s (%s)", crm_leads, active_id)
        if active_lead:
            rec['crf_crm_lead_id'] = active_lead
        return rec    