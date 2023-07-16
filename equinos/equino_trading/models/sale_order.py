
# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
from odoo.tools.misc import DEFAULT_SERVER_DATE_FORMAT
from datetime import datetime

class sale_order(models.Model):
    _inherit = 'sale.order'
    _description = 'Sale Order'
    
    receips_ids = fields.Many2many('trading.receips', string='Recipes', related='opportunity_id.receips_ids', readonly=False)
    share_type = fields.Selection([['customer','Customer'],['recipes','Recipes']], string='Share to', default='customer', related='opportunity_id.share_type', readonly=False)
    
    def _is_equine(self):
        if self.opportunity_id:
            return self.opportunity_id.is_equine
        return False    
    is_equine = fields.Boolean(string='Equine Trading', related='opportunity_id.is_equine')
    
    def _service_type(self):
        if self.opportunity_id:
            return self.opportunity_id.service_type
        return None  
    service_type = fields.Selection(string='Service Type', selection=[['export','Export'],['import','Import'],['transit','Transit']], related='opportunity_id.service_type', readonly=True)
    
    def _sequence_date(self):
        if self.opportunity_id:
            return self.opportunity_id.sequence_date
        return None  
    sequence_date = fields.Date(string='Date', related='opportunity_id.sequence_date', readonly=False)
    
    def _sequence_qty(self):
        if self.opportunity_id:
            return self.opportunity_id.sequence_qty
        return None
    sequence_qty = fields.Integer(string='Quantity', related='opportunity_id.sequence_qty', readonly=False)
    
    def _sequence_departure(self):
        if self.opportunity_id:
            return self.opportunity_id.sequence_qty
        return None
    sequence_departure = fields.Many2one('fly.codes', string='Departure', related='opportunity_id.sequence_departure', readonly=False)
    
    def _sequence_arrive(self):
        if self.opportunity_id:
            return self.opportunity_id.sequence_arrive
        return None
    sequence_arrive = fields.Many2one('fly.codes', string='Arrive', related='opportunity_id.sequence_arrive', readonly=False) 
    
    sequence_specie = fields.Many2one('trading.species', related='opportunity_id.sequence_specie', string='Specie', readonly=False) 
    
    def _compute_certificates_regulates_count(self):
        self.certificates_regulates_count_ids = self.certificates_regulates_ids.sudo().search_count([])

    certificates_regulates_count_ids = fields.Integer(string='Certificates and Regulates', compute=_compute_certificates_regulates_count, default=0, store=True)
    
    def _certificates_regulates_ids(self):
        if self.opportunity_id:
            return self.opportunity_id.certificates_regulates_ids
        return None
    
    certificates_regulates_ids = fields.Many2many('certificates.regulates', string='Certificates and Regulations', related='opportunity_id.certificates_regulates_ids', readonly=False)
    
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
    
    def _compute_folders_count(self):
        self.certificates_regulates_folders_count_ids = self.certificates_regulates_folders_ids.sudo().search_count([])

    certificates_regulates_folders_count_ids = fields.Integer(string='Folders', compute=_compute_folders_count)
    
    def _certificates_regulates_folders_ids(self):
        if self.opportunity_id:
            return self.opportunity_id.certificates_regulates_folders_ids
        return None
    certificates_regulates_folders_ids = fields.Many2many('certificates.regulates.folders', string='Certificates and Regulations Folders', related='opportunity_id.certificates_regulates_folders_ids', readonly=False)
    
    sale_order_ids = fields.Many2one('sale.orders', string='Quotation')
    
    project_ids = fields.Many2one('project.project', string='Project Checklists', related='opportunity_id.project_ids', readonly=False)
    
    project_id = fields.Many2one('project.project', string='Project Tracking', related='opportunity_id.project_id', readonly=False)
   
    
    form_id = fields.Many2one('trading.forms', string='Form', related='opportunity_id.form_id', readonly=False)
    
    def _sequence_airline(self):
        if self.opportunity_id:
            return self.opportunity_id.trading_airline
        return None
    trading_airline = fields.Many2one('trading.airlines',string='Airline', related='opportunity_id.trading_airline', readonly=False) 
    
    def action_share_folder_documents(self):
        customer_id = self.partner_id
        if self.share_type == 'customer':
            self.share()
        elif self.share_type == 'recipes':
            if self.receips_ids:
                for recipe in self.receips_ids:
                    if recipe.contact_ids:
                        for contact in recipe.contact_ids:
                           self.partner_id = contact
                           self.share()
        else:
            None
        self.partner_id = customer_id
        
    def share(self):
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
            
            email_template = self.env.ref('equino_trading.sale_email_share_folder_documents')
            if len(attachment_ids) > 0:
                for attachment_id in attachment_ids:
                    email_template.attachment_ids =  [(4, attachment_id)]
                    
                email_template.send_mail(self.id, raise_exception=False, force_send=True)
                email_template.attachment_ids.unlink()
    
    def action_share_shipping_form(self):
        self.form_id.share_shipping_form(self.form_id)
    
    def action_create_shipping_form(self):
        count = self.env['trading.forms'].search_count([['crf_crm_lead_id', '=', self.opportunity_id.id]])        
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
            form.update({'crf_crm_lead_id': self.opportunity_id.id})
            unusable_forms = self.env['trading.forms'].search([['crf_crm_lead_id', '=', None]])
            if unusable_forms:
                unusable_forms.unlink() 
    
    
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
    
    @api.onchange('is_equine', 'sequence_date', 'sequence_qty', 'sequence_specie', 'sequence_departure', 'sequence_arrive', 'partner_id')
    def _onchange_(self):
        if self.opportunity_id:
            if self.opportunity_id.is_equine:
                crm_sequence = str(' ')
                if self.opportunity_id.sequence_date:
                    date = datetime.strptime(str(self.opportunity_id.sequence_date), DEFAULT_SERVER_DATE_FORMAT)
                    sequence_date = str(date.month) + str('-') + str(date.day) + str('-') + str(date.year)
                    crm_sequence += str(sequence_date) + str(' ')
                if self.opportunity_id.sequence_qty:
                    crm_sequence += str(self.opportunity_id.sequence_qty) + str(' ') + str(self.opportunity_id.sequence_specie.name) + str(' ')
                if self.opportunity_id.sequence_departure:
                    crm_sequence += str(self.opportunity_id.sequence_departure.code) + str('-')
                if self.opportunity_id.sequence_arrive:
                    crm_sequence += str(self.opportunity_id.sequence_arrive.code)
                if self.opportunity_id.partner_id:
                    crm_sequence += str(' ') + str(self.opportunity_id.partner_id.name)
                self.opportunity_id.name = str(crm_sequence).strip()
                self.origin = self.opportunity_id.name
    
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