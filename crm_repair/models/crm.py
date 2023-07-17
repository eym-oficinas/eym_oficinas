# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class crm(models.Model):
    _inherit = 'crm.lead'

    def _compute_repairs_count(self):
        self.repairs_count = self.env['repair.order'].sudo().search_count([('opportunity_id', '=', self.id)])

    repairs_count = fields.Integer(string='Repairs', compute="_compute_repairs_count")

    def action_repair_lead_new(self):
        return self.action_new_repair_order()

    def action_new_repair_order(self):
        view = self.env["ir.ui.view"].search([('xml_id','=','repair.view_repair_order_form')],limit=1)
        context = {
                    'search_default_opportunity_id': self.id,
                    'default_opportunity_id': self.id,
                    'search_default_partner_id': self.partner_id.id,
                    'default_partner_id': self.partner_id.id,
                    'default_address_id': self.partner_id.id,
                    'default_company_id': self.company_id.id or self.env.company.id,
                   }
        if self.user_id:
            context['default_user_id'] = self.user_id.id
        return {
                    'type': 'ir.actions.act_window',
                    'res_model': 'repair.order',
                    'view_type': 'form',
                    'view_mode': 'form',
                    'target': 'new',
                    'context': context
                }
    
    def action_view_repairs(self):
        domain = [['opportunity_id', '=', self.id]]
        return {
                    "name": _("Repair Orders"),
                    "type": "ir.actions.act_window",
                    "res_model": "repair.order",
                    "context": {'group_by': 'state'},
                    "view_mode": "tree,form",
                    "domain": domain
                }