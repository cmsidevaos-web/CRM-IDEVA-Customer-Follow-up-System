export const TELEGRAM_QUICK_FIX_SCRIPT = `-- ====================================================================
-- QUICK FIX FOR MISSING notification_queue & TRIGGERS IN SUPABASE
-- Run this in Supabase SQL Editor to instantly fix Order/Customer creation
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Topics Table if not exists
CREATE TABLE IF NOT EXISTS public.telegram_topics (
    topic_key TEXT PRIMARY KEY,
    topic_name TEXT NOT NULL,
    thread_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed topic mappings
INSERT INTO public.telegram_topics (topic_key, topic_name, thread_id)
VALUES 
    ('follow_up', '📋 Follow-up', 2),
    ('quotation', '💰 Quotation', 4),
    ('orders', '📦 Orders', 7),
    ('repeat_orders', '🔁 Repeat Orders', 8),
    ('overdue', '🔴 Overdue', 9),
    ('won_deals', '🏆 Won Deals', 10)
ON CONFLICT (topic_key) DO UPDATE 
SET thread_id = EXCLUDED.thread_id, topic_name = EXCLUDED.topic_name;

-- 3. Create Notification Queue Table
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(50) NOT NULL,
    topic_key VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    order_id VARCHAR(50),
    follow_up_id VARCHAR(50),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status_retry ON public.notification_queue(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_topic ON public.notification_queue(topic_key);

-- 4. Create Safe Notification Function (Will never crash parent transactions)
CREATE OR REPLACE FUNCTION public.create_notification(
    p_notification_type VARCHAR,
    p_topic_key VARCHAR,
    p_payload JSONB,
    p_customer_id VARCHAR DEFAULT NULL,
    p_order_id VARCHAR DEFAULT NULL,
    p_follow_up_id VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_queue_id UUID;
BEGIN
    BEGIN
        INSERT INTO public.notification_queue (
            notification_type,
            topic_key,
            customer_id,
            order_id,
            follow_up_id,
            payload,
            status,
            retry_count,
            next_retry_at
        ) VALUES (
            p_notification_type,
            p_topic_key,
            p_customer_id,
            p_order_id,
            p_follow_up_id,
            p_payload,
            'pending',
            0,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_queue_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'create_notification skipped queue insert: %', SQLERRM;
        RETURN NULL;
    END;

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Safe Order Trigger Function
CREATE OR REPLACE FUNCTION public.trg_order_telegram_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_cust RECORD;
    v_payload JSONB;
BEGIN
    BEGIN
        SELECT company_name, sales_owner INTO v_cust
        FROM public.customers WHERE id = NEW.customer_id;

        v_payload := jsonb_build_object(
            'companyName', COALESCE(v_cust.company_name, NEW.customer_name, 'ลูกค้า'),
            'orderId', NEW.id,
            'totalAmount', NEW.total_amount,
            'salesOwner', COALESCE(v_cust.sales_owner, 'Sales'),
            'deliveryDate', NEW.delivery_date,
            'closedDate', CURRENT_DATE,
            'customerId', NEW.customer_id
        );

        PERFORM public.create_notification('order_created', 'orders', v_payload, NEW.customer_id, NEW.id::text, NULL);
        PERFORM public.create_notification('customer_won', 'won_deals', v_payload, NEW.customer_id, NEW.id::text, NULL);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'trg_order_telegram_notify caught error: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_telegram ON public.orders;
CREATE TRIGGER trg_order_telegram
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trg_order_telegram_notify();
`;

export const TELEGRAM_SQL_SETUP_SCRIPT = `-- ====================================================================
-- SUPABASE + TELEGRAM NOTIFICATION ENGINE (PRODUCTION-READY DDL)
-- Target: PostgreSQL / Supabase
-- Telegram Group ID: -1004422388519
-- Topics:
--   Follow-up      = 2
--   Quotation      = 4
--   Orders         = 7
--   Repeat Orders  = 8
--   Overdue        = 9
--   Won Deals      = 10
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLES CREATION

-- 1.1 Telegram Settings Table
CREATE TABLE IF NOT EXISTS public.telegram_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    bot_token TEXT NOT NULL DEFAULT '7891234560:AAFx9831aB_crm_bot_token_secret',
    group_chat_id VARCHAR(100) NOT NULL DEFAULT '-1004422388519',
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial seed for telegram_settings
INSERT INTO public.telegram_settings (id, bot_token, group_chat_id, is_enabled)
VALUES ('default', '7891234560:AAFx9831aB_crm_bot_token_secret', '-1004422388519', TRUE)
ON CONFLICT (id) DO UPDATE 
SET group_chat_id = '-1004422388519', updated_at = CURRENT_TIMESTAMP;


-- 1.2 Telegram Topics Table
CREATE TABLE IF NOT EXISTS public.telegram_topics (
    topic_key TEXT PRIMARY KEY,
    topic_name TEXT NOT NULL,
    thread_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial topic mappings
INSERT INTO public.telegram_topics (topic_key, topic_name, thread_id)
VALUES 
    ('follow_up', '📋 Follow-up', 2),
    ('quotation', '💰 Quotation', 4),
    ('orders', '📦 Orders', 7),
    ('repeat_orders', '🔁 Repeat Orders', 8),
    ('overdue', '🔴 Overdue', 9),
    ('won_deals', '🏆 Won Deals', 10)
ON CONFLICT (topic_key) DO UPDATE 
SET thread_id = EXCLUDED.thread_id, topic_name = EXCLUDED.topic_name;


-- 1.3 Notification Queue Table
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(50) NOT NULL,
    topic_key VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    order_id VARCHAR(50),
    follow_up_id VARCHAR(50),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled')),
    retry_count INT DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Queue performance index
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_retry ON public.notification_queue(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_topic ON public.notification_queue(topic_key);


-- 1.4 Telegram Notification Logs Table
CREATE TABLE IF NOT EXISTS public.telegram_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.notification_queue(id) ON DELETE SET NULL,
    telegram_chat_id VARCHAR(100) NOT NULL,
    telegram_thread_id INT,
    telegram_message_id VARCHAR(100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('SENT', 'FAILED', 'PENDING')),
    response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telegram_logs_queue_id ON public.telegram_notification_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_created ON public.telegram_notification_logs(created_at DESC);


-- 2. SQL FUNCTIONS

-- Function 2.1: create_notification() (Safe insertion)
CREATE OR REPLACE FUNCTION public.create_notification(
    p_notification_type VARCHAR,
    p_topic_key VARCHAR,
    p_payload JSONB,
    p_customer_id VARCHAR DEFAULT NULL,
    p_order_id VARCHAR DEFAULT NULL,
    p_follow_up_id VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_queue_id UUID;
BEGIN
    BEGIN
        INSERT INTO public.notification_queue (
            notification_type,
            topic_key,
            customer_id,
            order_id,
            follow_up_id,
            payload,
            status,
            retry_count,
            next_retry_at
        ) VALUES (
            p_notification_type,
            p_topic_key,
            p_customer_id,
            p_order_id,
            p_follow_up_id,
            p_payload,
            'pending',
            0,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_queue_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'create_notification skipped queue insert: %', SQLERRM;
        RETURN NULL;
    END;

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function 2.2: queue_notification() (Alias)
CREATE OR REPLACE FUNCTION public.queue_notification(
    p_type VARCHAR,
    p_topic_key VARCHAR,
    p_payload JSONB,
    p_customer_id VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
BEGIN
    RETURN public.create_notification(p_type, p_topic_key, p_payload, p_customer_id, NULL, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function 2.3: process_notification_queue()
CREATE OR REPLACE FUNCTION public.process_notification_queue()
RETURNS TABLE (
    queue_id UUID,
    notification_type VARCHAR,
    topic_key VARCHAR,
    thread_id INT,
    payload JSONB,
    retry_count INT
) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.notification_queue q
    SET status = 'processing'
    WHERE q.id IN (
        SELECT sub.id
        FROM public.notification_queue sub
        WHERE sub.status IN ('pending', 'failed')
          AND sub.retry_count < 5
          AND sub.next_retry_at <= CURRENT_TIMESTAMP
        ORDER BY sub.created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 20
    )
    RETURNING 
        q.id AS queue_id,
        q.notification_type,
        q.topic_key,
        (SELECT t.thread_id FROM public.telegram_topics t WHERE t.topic_key = q.topic_key LIMIT 1) AS thread_id,
        q.payload,
        q.retry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function 2.4: retry_failed_notifications()
CREATE OR REPLACE FUNCTION public.retry_failed_notifications()
RETURNS INT AS $$
DECLARE
    v_updated_count INT;
BEGIN
    UPDATE public.notification_queue
    SET status = 'pending',
        next_retry_at = CURRENT_TIMESTAMP + (
            CASE retry_count
                WHEN 0 THEN INTERVAL '1 minute'
                WHEN 1 THEN INTERVAL '5 minutes'
                WHEN 2 THEN INTERVAL '15 minutes'
                WHEN 3 THEN INTERVAL '30 minutes'
                ELSE INTERVAL '60 minutes'
            END
        )
    WHERE status = 'failed' AND retry_count < 5;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function 2.5: cleanup_old_notifications()
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(days INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM public.notification_queue
    WHERE status IN ('success', 'cancelled')
      AND created_at < (CURRENT_TIMESTAMP - (days || ' days')::INTERVAL);

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. SAFE DATABASE TRIGGERS

-- Trigger 3.1: Follow-up & Overdue Trigger
CREATE OR REPLACE FUNCTION public.trg_followup_telegram_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_cust RECORD;
    v_payload JSONB;
BEGIN
    BEGIN
        SELECT company_name, contact_name, phone, sales_owner INTO v_cust
        FROM public.customers WHERE id = NEW.customer_id;

        IF NEW.status = 'OVERDUE' OR (NEW.follow_up_date < CURRENT_DATE AND NEW.status != 'completed') THEN
            v_payload := jsonb_build_object(
                'companyName', COALESCE(v_cust.company_name, 'ลูกค้า'),
                'contactName', COALESCE(v_cust.contact_name, ''),
                'phone', COALESCE(v_cust.phone, ''),
                'nextFollowUpDate', NEW.follow_up_date,
                'overdueDays', GREATEST(1, (CURRENT_DATE - NEW.follow_up_date)),
                'salesOwner', COALESCE(v_cust.sales_owner, 'Sales'),
                'nextAction', COALESCE(NEW.next_action, ''),
                'customerId', NEW.customer_id
            );
            PERFORM public.create_notification('overdue', 'overdue', v_payload, NEW.customer_id, NULL, NEW.id::text);
        ELSIF NEW.follow_up_date = CURRENT_DATE THEN
            v_payload := jsonb_build_object(
                'companyName', COALESCE(v_cust.company_name, 'ลูกค้า'),
                'contactName', COALESCE(v_cust.contact_name, ''),
                'phone', COALESCE(v_cust.phone, ''),
                'nextFollowUpDate', NEW.follow_up_date,
                'salesOwner', COALESCE(v_cust.sales_owner, 'Sales'),
                'nextAction', COALESCE(NEW.next_action, ''),
                'customerId', NEW.customer_id
            );
            PERFORM public.create_notification('follow_up_today', 'follow_up', v_payload, NEW.customer_id, NULL, NEW.id::text);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'trg_followup_telegram_notify error: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_followup_telegram ON public.follow_ups;
CREATE TRIGGER trg_followup_telegram
AFTER INSERT OR UPDATE ON public.follow_ups
FOR EACH ROW EXECUTE FUNCTION public.trg_followup_telegram_notify();


-- Trigger 3.2: Order & Won Deals Trigger (Protected)
CREATE OR REPLACE FUNCTION public.trg_order_telegram_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_cust RECORD;
    v_payload JSONB;
BEGIN
    BEGIN
        SELECT company_name, sales_owner INTO v_cust
        FROM public.customers WHERE id = NEW.customer_id;

        v_payload := jsonb_build_object(
            'companyName', COALESCE(v_cust.company_name, NEW.customer_name, 'ลูกค้า'),
            'orderId', NEW.id,
            'totalAmount', NEW.total_amount,
            'salesOwner', COALESCE(v_cust.sales_owner, 'Sales'),
            'deliveryDate', NEW.delivery_date,
            'closedDate', CURRENT_DATE,
            'customerId', NEW.customer_id
        );

        PERFORM public.create_notification('order_created', 'orders', v_payload, NEW.customer_id, NEW.id::text, NULL);
        PERFORM public.create_notification('customer_won', 'won_deals', v_payload, NEW.customer_id, NEW.id::text, NULL);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'trg_order_telegram_notify error: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_telegram ON public.orders;
CREATE TRIGGER trg_order_telegram
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trg_order_telegram_notify();


-- Trigger 3.3: Customer Status Won Trigger (Protected)
CREATE OR REPLACE FUNCTION public.trg_customer_won_telegram_notify()
RETURNS TRIGGER AS $$
DECLARE
    v_payload JSONB;
BEGIN
    BEGIN
        IF (NEW.status = 'WON' OR NEW.status = 'won') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
            v_payload := jsonb_build_object(
                'companyName', NEW.company_name,
                'contactName', NEW.contact_name,
                'salesOwner', NEW.sales_owner,
                'dealValue', NEW.total_purchases,
                'closedDate', CURRENT_DATE,
                'customerId', NEW.id
            );
            PERFORM public.create_notification('customer_won', 'won_deals', v_payload, NEW.id, NULL, NULL);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'trg_customer_won_telegram_notify error: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_won_telegram ON public.customers;
CREATE TRIGGER trg_customer_won_telegram
AFTER UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.trg_customer_won_telegram_notify();
`;
