# -*- coding: utf-8 -*-

from os import error
from odoo import models, fields, api, exceptions
from odoo.exceptions import UserError

import logging
_logger = logging.getLogger(__name__)

class certificates_regulates(models.Model):
    _name = 'certificates.regulates'
    _description = 'Certifications Regulations'
    
    name = fields.Char(string='Name')
    
    file_name = fields.Char(string='Name')
    file = fields.Binary(string='File', filename=file_name,  attachment=True)
    sit_pre_visualizar = fields.Boolean(string='Visualizar Documento', default=False)
    
    
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
    # crf_crm_lead_id = fields.One2many('crm.lead', string='CRM Leads', inverse_name="certificates_regulates_folders_ids")
    crf_crm_lead_id = fields.Many2one('crm.lead', string='CRM Leads')


 


    def compute_certificates_regulates_ids(self):
        _logger.info("SIT compute_certificates_regulates_ids self=%s", self)
        # folder_0 = self.env['certificates.regulates.folders'].search([['id','=',self.id ]])
        # _logger.info("SIT compute_certificates_regulates_ids folder_0=%s", folder_0)
        

        document_folder_ids = []
        for record in self:
            _logger.info("SIT compute_certificates_regulates_ids record=%s", record)
            _logger.info("SIT compute_certificates_regulates_ids record.name=%s", record.name)
            _logger.info("SIT compute_certificates_regulates_ids record.certificates_regulates_ids=%s", record.certificates_regulates_ids)
            _logger.info("SIT compute_certificates_regulates_ids record.crf_crm_lead_id=%s", record.crf_crm_lead_id)
            folders = self.env['certificates.regulates.folders'].search([['crf_crm_lead_id','=',record.crf_crm_lead_id.id ]])
            _logger.info("SIT compute_certificates_regulates_ids folders con crm de esta oportunidad=%s", folders)

            for folder in folders:
                _logger.info("SIT compute_certificates_regulates_ids folder=%s (%s)", folder, folder.name)

                document_folder_ids.append(folder.id)
            if len(document_folder_ids):
                _logger.info("SIT certificates_regulates_ids document_folder_ids=%s ", document_folder_ids)
                # record.filter_certificates_regulates_ids = self.env['certificates.regulates.folders'].search([['id','=',document_folder_ids]])
                record.filter_certificates_regulates_ids = document_folder_ids
            else:
                record.filter_certificates_regulates_ids = None


    filter_certificates_regulates_ids = fields.Many2many('certificates.regulates', string='Certificates and Regulations', readonly=False, compute=compute_certificates_regulates_ids)


    def compute_certificates_regulates_ids(self):
        _logger.info("SIT compute_certificates_regulates_ids self=%s", self)
        document_folder_ids = []
        for record in self:
            
            for folder in record.certificates_regulates_folders_ids:
                # for document in folder.certificates_regulates_ids:
                    document_folder_ids.append(folder.id)
                    MENSAJE = "document_folder_ids" + str(document_folder_ids)
                    raise UserError (MENSAJE)
            # if len(document_folder_ids):
            #     _logger.info("SIT compute_certificates_regulates_folders_ids document_folder_ids=%s ", document_folder_ids)
            #     record.filter_certificates_regulates_folders_ids = self.env['certificates.regulates.folders'].search([['id','in',document_folder_ids]])
            # else:
            #     record.filter_certificates_regulates_folders_ids = None

    # filter_certificates_regulates_folders_ids = fields.Many2many('certificates.regulates.folders', string='Certificates and Regulations Folders', readonly=False, compute=compute_certificates_regulates_folders_ids)
    














    # @api.model
    # def default_get(self, vals):
    #     rec = super(certificates_regulates_folders, self).default_get(vals)
    #     active_id =  self.env.context.get('active_id')
    #     active_lead = self.env['crm.lead'].browse(self._context['active_id'])
    #     # crm_leads = self.env['crm.lead'].search([('id','=', active_id) ])
    #     # _logger.info("SIT     product_get : %s (%s)", crm_leads, active_id)
    #     if active_lead:
    #         rec['crf_crm_lead_id'] = active_lead
    #     return rec    

    @api.model
    def default_get(self, vals):
        rec = super(certificates_regulates_folders, self).default_get(vals)
        active_id =  self.env.context.get('active_id')
        _logger.info("SIT     product_get : %s (%s)", rec, active_id)

        active_lead = self.env['crm.lead'].browse(self._context['active_id'])
        # crm_leads = self.env['crm.lead'].search([('id','=', active_id) ])
        # _logger.info("SIT     product_get : %s (%s)", crm_leads, active_id)
        if active_lead:
            rec['crf_crm_lead_id'] = active_lead
        return rec        