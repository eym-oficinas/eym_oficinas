# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
from odoo.tools.misc import DEFAULT_SERVER_DATE_FORMAT
from datetime import datetime
from odoo.http import request

import logging
_logger = logging.getLogger(__name__)

SERVICE_TYPE = [['export','Export'],['import','Import'],['transit','Transit']]

class crm_lead(models.Model):
    _inherit = 'crm.lead'
    _description = 'Oportunities'
    
    email = fields.Char(string='Email', related='partner_id.email')
    phone = fields.Char(string='Phone', related='partner_id.phone')
    mobile = fields.Char(string='Mobile', related='partner_id.mobile')
    
    # sequence builder
    is_equine = fields.Boolean(string='Equine Trading', default=False)
    service_type = fields.Selection(string='Service Type', selection=SERVICE_TYPE)
    sequence_date = fields.Date(string='Arrival / Departure Date')
    sequence_qty = fields.Integer(string='Quantity')
    
    sequence_specie = fields.Many2one('trading.species', string='Specie')
    sequence_departure = fields.Many2one('fly.codes', string='Departure')
    sequence_arrive = fields.Many2one('fly.codes', string='Arrive')  
    trading_airline = fields.Many2one('trading.airlines',string='Airline')  
    
    receips_ids = fields.Many2many('trading.receips', string='Recipes', readonly=False)
    share_type = fields.Selection([['customer','Customer'],['recipes','Recipes']], string='Share to', default='customer')
    
    def _compute_certificates_regulates_count(self):
        self.certificates_regulates_count_ids = self.certificates_regulates_ids.sudo().search_count([])
        _logger.info("SIT _compute_certificates_regulates_count : %s", self.certificates_regulates_count_ids)

    certificates_regulates_count_ids = fields.Integer(string='Certificates and Regulates', compute=_compute_certificates_regulates_count, default=0, store=True)
    # certificates_regulates_count_ids = fields.Integer(string='Certificates and Regulates', compute=_compute_certificates_regulates_count, default=0)
    
    def compute_certificates_regulates_ids(self):
        document_ids = []
        for record in self:
            for folder in record.certificates_regulates_folders_ids:
                for document in folder.certificates_regulates_ids:
                    document_ids.append(document.id)
            if len(document_ids):
                record.filter_certificates_regulates_ids = self.env['certificates.regulates'].search([['id','in',document_ids]])
            else:
                record.filter_certificates_regulates_ids = None
    
    filter_certificates_regulates_ids = fields.Many2many('certificates.regulates', string='Certificates and Regulations', readonly=False, compute=compute_certificates_regulates_ids)
    
    certificates_regulates_ids = fields.Many2many('certificates.regulates', string='Certificates and Regulations', readonly=False)
    
    def _compute_folders_count(self):
        # _logger.info("SIT certificates_regulates_folders_count_ids : %s", self.id    )

        self.certificates_regulates_folders_count_ids = self.certificates_regulates_folders_ids.sudo().search_count([ ])
        # self.certificates_regulates_folders_count_ids = self.certificates_regulates_folders_ids.sudo().search_count([ ('crf_crm_lead_id', '=', self.id) ])
        # self.certificates_regulates_folders_count_ids = self.env['certificates.regulates.folders'].search([ ('crf_crm_lead_id', '=', self.id) ])
        sit_id = self.id
        _logger.info("SIT certificates_regulates_folders_count_ids1 : %s", self.certificates_regulates_folders_ids)

        # for dato in (dato = self.certificates_regulates_folders_ids.sudo().search_read([ ])) :
        for dato in self.certificates_regulates_folders_ids :
            
        
        # _logger.info("SIT certificates_regulates_folders_count_ids1 : %s", self.certificates_regulates_folders_ids.sudo().search_read([ ]))
            _logger.info("SIT certificates_regulates_folders_count_ids2ii : %s", dato)
        # _logger.info("SIT certificates_regulates_folders_count_ids3 : %s", dato.crf_crm_lead_id)
        # _logger.info("SIT certificates_regulates_folders_count_ids4 : %s", dato.crf_crm_lead_id.id)
        # dato1 = dato.filtered(lambda c: c.crf_crm_lead_id > sit_id) 
            # dato1 =  [index for (index, item) in enumerate(dato) if item['crf_crm_lead_id'] == [sit_id] ]

            # _logger.info("SIT certificates_regulates_folders_count_ids5 : %s (%s)", dato1, len(dato1))
        # self.certificates_regulates_folders_count_ids = len(dato1)
        self.certificates_regulates_folders_count_ids = len(self.certificates_regulates_folders_ids)



    certificates_regulates_folders_count_ids = fields.Integer(string='Folders', compute=_compute_folders_count)
    # certificates_regulates_folders_ids = fields.Many2many('certificates.regulates.folders', string='Certificates and Regulations Folders')
    certificates_regulates_folders_ids = fields.Many2many('certificates.regulates.folders', string='Certificates and Regulations Folders', inverse_name="crf_crm_lead_id")
    
    sale_order_ids = fields.Many2one('sale.orders', string='Quotation')
    project_ids = fields.Many2one('project.project', string='Project Checklists')
    
    project_id = fields.Many2one('project.project', string='Project Tracking', inverse_name="crm_lead_id")
    is_project_template = fields.Boolean(string='Template', related='project_id.is_trading_template')
    
    equines_ids = fields.Many2one('fly.codes', string='Equines')
    
    form_id = fields.Many2one('trading.forms', string='Form', inverse_name="crf_crm_lead_id")
    
    def _compute_invoice_count(self):
        invoice_ids = []
        for record in self:
            if record.order_ids:
                for sale_order in record.order_ids:
                    for invoice in sale_order.invoice_ids.ids:
                        invoice_ids.append(invoice)
            record.invoice_count = len(invoice_ids)

    invoice_count = fields.Integer(string='Invoices', compute=_compute_invoice_count, default=0, store=True)
    
    @api.onchange('is_equine', 'sequence_date', 'sequence_qty', 'sequence_specie', 'sequence_departure', 'sequence_arrive', 'partner_id')
    def _onchange_(self):
        if self:
            if self.is_equine:
                crm_sequence = str('')
                self.name = str(crm_sequence).strip()               

                if self.sequence_date:
                    date = datetime.strptime(str(self.sequence_date), DEFAULT_SERVER_DATE_FORMAT)
                    sequence_date = str(date.month) + str('-') + str(date.day) + str('-') + str(date.year)
                    crm_sequence += str(sequence_date) + str(' ')
                if self.sequence_qty:
                    crm_sequence += str(self.sequence_qty) + str(' ') 
                if self.sequence_specie:
                    crm_sequence += str(self.sequence_specie.name) + str(' ')                    
                if self.sequence_departure:
                    if self.sequence_arrive:
                        crm_sequence += str(self.sequence_departure.code) + str('-') + str(self.sequence_arrive.code)
                    else:
                        crm_sequence += str(self.sequence_departure.code) + str(' ')

                if self.partner_id:
                    crm_sequence += str(' ')  + "-" + str(self.partner_id.name)
                _logger.info("SIT name = %s  | %s", str(crm_sequence).strip(), str(self.name) )
                self.name = str(crm_sequence).strip()             
                
                    
    def action_view_folders(self):
        ids = []
        if self.certificates_regulates_folders_ids:
            for folder in self.certificates_regulates_folders_ids:
                ids.append(folder.id)
        filter = [['id', 'in', ids]]
        _logger.info("SIT filter : %s (%s)", filter, self.id)
        return {
                    "name": _("Folders"),
                    "type": "ir.actions.act_window",
                    "res_model": "certificates.regulates.folders",
                    #"context": {'group_by': 'state'},
                    "view_mode": "tree,form",
                    "domain": filter,
                    # "crf_crm_lead_id": self.id,
                    # "sit_id": self.id
                }
    
    def action_view_files(self):

        filter = [['cr_crm_lead_id', '=', self.id]]
        _logger.info("SIT action_view_files filter: %s", filter)
        return {
                    "name": _("Documents"),
                    "type": "ir.actions.act_window",
                    "res_model": "certificates.regulates",
                    "view_mode": "tree,form",
                    "domain": filter
                }
    
    def action_new_quotation(self):
        action = super(crm_lead,self).action_new_quotation()
        
        action['context']['default_is_equine'] = self.is_equine
        action['context']['default_service_type'] = self.service_type
        action['context']['default_sequence_date'] = self.sequence_date
        action['context']['default_sequence_qty'] = self.sequence_qty
        
        if self.sequence_departure:
            action['context']['default_sequence_departure'] = self.sequence_departure.id
        
        if self.sequence_arrive:
            action['context']['default_sequence_arrive'] = self.sequence_arrive.id
        
        if self.certificates_regulates_ids:
            action['context']['default_certificates_regulates_ids'] = self.certificates_regulates_ids.ids
        
        if self.certificates_regulates_folders_ids:
            action['context']['default_certificates_regulates_folders_ids'] = self.certificates_regulates_folders_ids.ids
        
        if self.project_ids:
            action['context']['default_project_ids'] = self.project_ids.ids
            
        if self.equines_ids:
            action['context']['default_equines_ids'] = self.equines_ids.ids
            
        if self.form_id:
            action['context']['default_form_id'] = self.form_id.id
        
        return action
    
    def action_replicate_project_tracking(self):
        non_template_project = self.env['project.project'].replicate_project_tracking(self)  
        self.project_id = non_template_project
    
    def action_share_shipping_form(self):
        response = self.form_id.share_shipping_form(self.form_id)
        if response:
            _type = 'success'
            _message = 'Shipping form was sent'
        else:
            _type = 'warning'
            _message = 'Shipping form was not sent'
            
        message = {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': ('Shipping Form'),
                'message': _message,
                'type':_type,
                'sticky': False,
            },
        }
        return message
    
    def action_create_shipping_form(self):
        count = self.env['trading.forms'].search_count([['crf_crm_lead_id', '=', self.id]]) 
          
        if count > 0:
            raise UserError ('Shipping form already exist and was assigned again to this form instead create new one.')
        else:
            form = self.env['trading.forms'].create({
                                                        'name': 'Live Cargo shipping list form', 
                                                        'shipper_id': self.partner_id.id, 
                                                        'from_departure_id': self.sequence_departure.id, 
                                                        'to_arrive_id': self.sequence_arrive.id, 
                                                        'entry_date': self.sequence_date
                                                    })
            
            self.form_id = form
            form.update({'crf_crm_lead_id':self.id})
            unusable_forms = self.env['trading.forms'].search([['crf_crm_lead_id', '=', None]]) 
            if unusable_forms:
                unusable_forms.unlink()

    def action_share_folder_documents(self):
        response = None
        customer_id = self.partner_id
        if self.share_type == 'customer':
            response = self.share()
        elif self.share_type == 'recipes':
            if self.receips_ids:
                for recipe in self.receips_ids:
                    if recipe.contact_ids:
                        for contact in recipe.contact_ids:
                           self.partner_id = contact
                           response = self.share()
        else:
            None

        self.partner_id = customer_id
        
        if response:
            _type = 'success'
            _message = 'Documents was sent'
        else:
            _type = 'warning'
            _message = 'Documents was not sent'
            
        message = {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': ('Files'),
                'message': _message,
                'type':_type,
                'sticky': False,
            },
        }
        return message
    sit_subject = fields.Char("Asunto")
    sit_body = fields.Html("Body")
    
    def share(self):
        response = None
        attachment_ids = []
        if self.certificates_regulates_folders_ids:
            for folder in self.certificates_regulates_folders_ids:                
                if folder.certificates_regulates_ids:
                    for document in folder.certificates_regulates_ids:
                        if document.id in self.certificates_regulates_ids.ids:
                            if document.type == 'binary':
                                attachment = { 
                                            'name': str(document.file_name),
                                            'datas': document.file,
                                            'res_model': str('certificates.regulates'),                                          
                                            'type': 'binary'
                                            }
                                attachment_id = self.env['ir.attachment'].create(attachment)
                                attachment_ids.append(attachment_id.id)
            email_template = self.env.ref('equino_trading.crm_email_share_folder_documents')
            if len(attachment_ids) > 0:
                for attachment_id in attachment_ids:
                    email_template.attachment_ids =  [(4, attachment_id)]
                    
                response = email_template.send_mail(self.id, raise_exception=False, force_send=True)
                email_template.attachment_ids.unlink()
        return response
    
    def action_view_track(self):        
        filter = [['id', 'in', self.project_id.project_tracker_grid_ids.ids]]
        tree_id = self.env.ref('equino_trading.view_project_tracker_grid_tree')
        return {
                    "name": _("Track for " + str(self.project_id.name) ),
                    "type": "ir.actions.act_window",
                    "res_model": "project.tracker.grid",
                    "views": [[tree_id.id, "tree"]],
                    "view_mode": "tree",
                    "domain": filter
                } 
    
    def action_view_track_form(self):  
        if self.project_id:
            res_id = self.env['project.tracker.grid'].search([['project_id','=',self.project_id.id]],limit=1)
            return {
                        "name": _("Track for " + str(self.project_id.name) ),
                        "type": "ir.actions.act_window",
                        "res_model": "project.tracker.grid",
                        "view_mode": "form",
                        "res_id": res_id.id,
                } 
    
    def action_view_invoices(self):
        invoice_ids = []
        if self.order_ids:
            for sale_order in self.order_ids:
                for invoice in sale_order.invoice_ids.ids:
                    invoice_ids.append(invoice)
            filter = [['id', 'in', invoice_ids]]
        
            return {
                        "name": _("Invoices for " + str(self.name) ),
                        "type": "ir.actions.act_window",
                        "res_model": "account.move",
                        "view_mode": "tree,form",
                        "domain": filter
                    }

    @api.onchange('service_type')
    def _onchange_service_type(self):
        arguments = {
                        'crm':self
                    }
        self.env['change.fields'].handle_global_fields('update_service_type', arguments)

    @api.onchange('sequence_qty')
    def _onchange_sequence_qty(self):
        arguments = {
                        'crm':self
                    }
        self.env['change.fields'].handle_global_fields('update_qty', arguments)    
    
    @api.onchange('sequence_date')
    def _onchange_sequence_date(self):
        arguments = {
                        'crm':self
                    }
        self.env['change.fields'].handle_global_fields('update_sequence_date', arguments)  
        
    @api.onchange('name')
    def _onchange_sequence_datey(self):
        arguments = {
                        'crm':self
                    }
        self.env['change.fields'].handle_global_fields('update_name', arguments)  
        