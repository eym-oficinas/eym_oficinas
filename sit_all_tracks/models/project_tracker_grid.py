# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import logging
_logger = logging.getLogger(__name__)
from odoo.exceptions import UserError


class sit_project_tracks(models.Model):
    _inherit = 'project.tracker.grid'
    
    status = fields.Char(compute='_verify_responsible')


    project_id_status = fields.Char(string='project_id_status')
    service_type_status = fields.Char(string='Service Type')
    estimate_departmenture_arrival_status = fields.Char(string='Estimate Departure / Arrival')
    import_permit_status = fields.Char(string='Import Permit')
    import_permit_paid_status = fields.Char(string='Import Permit Paid')
    usda_res_72hrs_date_status = fields.Char(string='USDA RES 72HRS')
    usda_res_72hrs_status = fields.Char(string='72HRS/PERMIT USDA SENT Date')
    field_17_29_status = fields.Char(string='17-29')
    usda_mac_sent_date_status = fields.Char(string='17-29 SENT Date')
    realse_date_departure_status = fields.Char(string='Relase Date/Departure')
    hc_start_res_paid_status = fields.Char(string='H C Start')
    hc_end_res_paid_status = fields.Char(string='H C End')
    hc_expiration_status = fields.Char(string='H C Expiration')
    hc_sent_to_usda_status = fields.Char(string='H C sent to USDA')
    hc_endorsed_status = fields.Char(string='HC ENDORSED')
    billed_paid_status = fields.Char(string='BILLED / PAID')
    mac_shipment_id_status = fields.Char(string='MAC Shipment ID')
    q_start_reserve_status = fields.Char(string='Q Start / Reserve')
    custom_clarance_status = fields.Char(string='Custom Clearance')
    invoice_shipping_ccial_freigth_forward_status = fields.Char(string='Envio Factura CCial Freight Forward/ EXPO')
    airline_reserve_guide_status = fields.Char(string='Reserva y Guia Aerolinea / Expo')
    awb_paid_status = fields.Char(string='AWB PAID')
    pc_check_date_status = fields.Char(string='PC CHECK Date')
    pc_check_status = fields.Char(string='PC CHECK')    
    stalls_status = fields.Char(string='STALLS')
    awb_status = fields.Char(string='AWB')
    cert_origin_status = fields.Char(string='Cert of Origen')
    tags_ship_status = fields.Char(string='TAGS  SHIP')
    actual_work_status = fields.Integer(string='Actual Work (in hours)')
    animal_handler_status = fields.Char(string='Animal Handler')
    pending_status = fields.Char(string='Pending')
    stalls_2_status = fields.Char(string='STALLS2')
    stalls_set3_status = fields.Char(string='STALLS set3')
    pending6_status = fields.Char(string='pending6')
    is_trading_template_status = fields.Char(string='Template', )
    #Nuevos campos
    shipping_list_status = fields.Char(string='Shipping list')
    contingency_plan_status = fields.Char(string='Contingency plan')
    shipping_list_final_dest_status = fields.Char(string='Shippping list final destination')
    coord_shipping_list_drivers_status = fields.Char(string='Coordinar shipping list drivers')
    hc_origin_status = fields.Char(string='Helath certificate Origin')
    import_permit_destinity_country_status = fields.Char(string='Import Permit Destinity country send Veterinary')
    jockey_club_status = fields.Char(string='Jockey Club')
    stalls_in_start_status = fields.Char(string='STALLS IN Start')
    commercial_invoice_status = fields.Char(string='Comercial Invoice')
    commercial_invoice_and_awv_sent_to_c_status = fields.Char(string='Commecial invoice ans AWB send to customer')
    animal_handler_confirmed_status = fields.Char(string='Animal Handler Confirmed')
    coordinar_wls_status = fields.Char(string='Coordinar WLS')
    coordinar_mac_status = fields.Char(string='Coordinar MAC')
    coordinar_conductor_status = fields.Char(string='Coordinar conductor')

    def _verify_responsible(self):
        # Obtiene el cursor de la base de datos
        responsables = self.env['sit_all_tracks.sit_all_tracks'].search([])
                    #    self.env['sale.order'].search([['origin', '=', self.name]], limit=1)
        _logger.info("SIT responsables =%s", responsables)
        for i in self:
            _logger.info("SIT i ------------------------------------------------------------")
            _logger.info("SIT self =%s", i)
            _logger.info("SIT self =%s", i.name)
            i.project_id_status = "CEO"


            for campo in responsables:
                _logger.info("SIT cmpoo ------------------------------------------------------------")
                _logger.info("SIT campo =%s", campo.service_type)
                nombr = "i." + str(campo.service_type) + "_status"
                _logger.info("SIT nombr =%s", nombr)
                _logger.info("SIT self_ =%s", i.project_id_status)
                if campo.responsability:
                    _logger.info("SIT campo =%s", campo.responsability)
                else:
                    _logger.info("SIT campo =%s", "NONE")

                _logger.info("SIT campo =%s", campo)
                
                _logger.info("SIT campo.name =%s", campo.responsability)
                # _logger.info("SIT self.name =%s", self.name)
                # for i in self:
                #     _logger.info("SIT self =%s", i)
                #     _logger.info("SIT self =%s", i.name)


                # Define la consulta SQL    
        self.status = "TRUE"