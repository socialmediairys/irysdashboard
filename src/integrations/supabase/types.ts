export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agenda_itens: {
        Row: {
          cliente_id: string | null
          concluido: boolean
          created_at: string
          data_hora: string
          descricao: string | null
          duracao_min: number | null
          id: string
          org_id: string | null
          prioridade: string | null
          responsavel_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          concluido?: boolean
          created_at?: string
          data_hora: string
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          org_id?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          concluido?: boolean
          created_at?: string
          data_hora?: string
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          org_id?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_itens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_itens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      arquivos: {
        Row: {
          bucket: string
          cliente_id: string | null
          contexto: Database["public"]["Enums"]["arquivo_contexto"]
          created_at: string
          descricao: string | null
          duracao_segundos: number | null
          id: string
          nome_original: string
          nome_storage: string
          ordem: number
          tamanho_bytes: number | null
          tarefa_id: string | null
          tipo_arquivo: Database["public"]["Enums"]["arquivo_tipo"]
          titulo: string | null
          updated_at: string
          uploader_id: string | null
          url_publica: string | null
          visivel_cliente: boolean
        }
        Insert: {
          bucket: string
          cliente_id?: string | null
          contexto?: Database["public"]["Enums"]["arquivo_contexto"]
          created_at?: string
          descricao?: string | null
          duracao_segundos?: number | null
          id?: string
          nome_original: string
          nome_storage: string
          ordem?: number
          tamanho_bytes?: number | null
          tarefa_id?: string | null
          tipo_arquivo?: Database["public"]["Enums"]["arquivo_tipo"]
          titulo?: string | null
          updated_at?: string
          uploader_id?: string | null
          url_publica?: string | null
          visivel_cliente?: boolean
        }
        Update: {
          bucket?: string
          cliente_id?: string | null
          contexto?: Database["public"]["Enums"]["arquivo_contexto"]
          created_at?: string
          descricao?: string | null
          duracao_segundos?: number | null
          id?: string
          nome_original?: string
          nome_storage?: string
          ordem?: number
          tamanho_bytes?: number | null
          tarefa_id?: string | null
          tipo_arquivo?: Database["public"]["Enums"]["arquivo_tipo"]
          titulo?: string | null
          updated_at?: string
          uploader_id?: string | null
          url_publica?: string | null
          visivel_cliente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "arquivos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          auth_user_id: string | null
          created_at: string
          data_inicio_contrato: string | null
          data_vencimento_contrato: string | null
          email: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          init: string | null
          link_contrato_assinado: string | null
          nome: string
          org_id: string | null
          plano_atual: Database["public"]["Enums"]["plano_atual"] | null
          plano_label: string | null
          slug: string
          status_cadastro: string
          status_contrato: Database["public"]["Enums"]["status_contrato"]
          telefone: string | null
          updated_at: string
          valor_mensal: number | null
          versao_contrato: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          data_inicio_contrato?: string | null
          data_vencimento_contrato?: string | null
          email?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          init?: string | null
          link_contrato_assinado?: string | null
          nome: string
          org_id?: string | null
          plano_atual?: Database["public"]["Enums"]["plano_atual"] | null
          plano_label?: string | null
          slug?: string
          status_cadastro?: string
          status_contrato?: Database["public"]["Enums"]["status_contrato"]
          telefone?: string | null
          updated_at?: string
          valor_mensal?: number | null
          versao_contrato?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          data_inicio_contrato?: string | null
          data_vencimento_contrato?: string | null
          email?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          init?: string | null
          link_contrato_assinado?: string | null
          nome?: string
          org_id?: string | null
          plano_atual?: Database["public"]["Enums"]["plano_atual"] | null
          plano_label?: string | null
          slug?: string
          status_cadastro?: string
          status_contrato?: Database["public"]["Enums"]["status_contrato"]
          telefone?: string | null
          updated_at?: string
          valor_mensal?: number | null
          versao_contrato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudos_cliente: {
        Row: {
          cliente_id: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          storage_bucket: string | null
          storage_path: string | null
          tipo: string
          titulo: string | null
          topico_id: string
          url: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          storage_bucket?: string | null
          storage_path?: string | null
          tipo: string
          titulo?: string | null
          topico_id: string
          url?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          storage_bucket?: string | null
          storage_path?: string | null
          tipo?: string
          titulo?: string | null
          topico_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_cliente_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topicos_fase"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_juridicos: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          nome: string
          publico: boolean
          tipo: string | null
          url: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          nome: string
          publico?: boolean
          tipo?: string | null
          url: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          publico?: boolean
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_juridicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas_financeiras: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          created_at: string
          data_ref: string
          descricao: string
          id: string
          status_pagamento: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          data_ref?: string
          descricao: string
          id?: string
          status_pagamento?: string
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          data_ref?: string
          descricao?: string
          id?: string
          status_pagamento?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "entradas_financeiras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategias: {
        Row: {
          cliente_id: string
          created_at: string
          formatos: Json
          id: string
          objetivo: string | null
          pilares: Json
          qtd_entregaveis: number
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          formatos?: Json
          id?: string
          objetivo?: string | null
          pilares?: Json
          qtd_entregaveis?: number
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          formatos?: Json
          id?: string
          objetivo?: string | null
          pilares?: Json
          qtd_entregaveis?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fases: {
        Row: {
          descricao: string | null
          id: number
          nome: string
        }
        Insert: {
          descricao?: string | null
          id: number
          nome: string
        }
        Update: {
          descricao?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      ferramentas: {
        Row: {
          categoria: string
          created_at: string
          criado_por: string | null
          custo_mensal: number
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          url: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          criado_por?: string | null
          custo_mensal?: number
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          url: string
        }
        Update: {
          categoria?: string
          created_at?: string
          criado_por?: string | null
          custo_mensal?: number
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      financas_administrativas: {
        Row: {
          categoria: Database["public"]["Enums"]["fin_categoria"]
          categoria_livre: string | null
          cliente_id: string | null
          created_at: string
          data_vencimento: string
          descricao: string | null
          id: string
          status_pagamento: Database["public"]["Enums"]["fin_status"]
          tipo: Database["public"]["Enums"]["fin_tipo"]
          valor: number
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["fin_categoria"]
          categoria_livre?: string | null
          cliente_id?: string | null
          created_at?: string
          data_vencimento: string
          descricao?: string | null
          id?: string
          status_pagamento?: Database["public"]["Enums"]["fin_status"]
          tipo: Database["public"]["Enums"]["fin_tipo"]
          valor: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["fin_categoria"]
          categoria_livre?: string | null
          cliente_id?: string | null
          created_at?: string
          data_vencimento?: string
          descricao?: string | null
          id?: string
          status_pagamento?: Database["public"]["Enums"]["fin_status"]
          tipo?: Database["public"]["Enums"]["fin_tipo"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financas_administrativas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          created_at: string | null
          data_vencimento: string
          descricao: string
          id: string
          org_id: string | null
          recorrente: boolean | null
          status: string | null
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          org_id?: string | null
          recorrente?: boolean | null
          status?: string | null
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          org_id?: string | null
          recorrente?: boolean | null
          status?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          google_email: string | null
          org_id: string | null
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          google_email?: string | null
          org_id?: string | null
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          google_email?: string | null
          org_id?: string | null
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          data_proxima_acao: string | null
          email: string | null
          etapa: string
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          potencial: string | null
          proxima_acao: string | null
          responsavel_id: string | null
          status: string
          telefone: string | null
          ultimo_contato: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          data_proxima_acao?: string | null
          email?: string | null
          etapa?: string
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          potencial?: string | null
          proxima_acao?: string | null
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          data_proxima_acao?: string | null
          email?: string | null
          etapa?: string
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          potencial?: string | null
          proxima_acao?: string | null
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_business_pages: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          ig_user_id: string | null
          ig_username: string | null
          org_id: string | null
          page_access_token: string
          page_id: string
          page_name: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          ig_user_id?: string | null
          ig_username?: string | null
          org_id?: string | null
          page_access_token: string
          page_id: string
          page_name?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          ig_user_id?: string | null
          ig_username?: string | null
          org_id?: string | null
          page_access_token?: string
          page_id?: string
          page_name?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_business_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_business_pages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklist: {
        Row: {
          cliente_id: string
          concluido: boolean
          created_at: string
          data_conclusao: string | null
          id: string
          ordem: number
          responsavel: Database["public"]["Enums"]["checklist_responsavel"]
          tarefa: string
        }
        Insert: {
          cliente_id: string
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          id?: string
          ordem?: number
          responsavel?: Database["public"]["Enums"]["checklist_responsavel"]
          tarefa: string
        }
        Update: {
          cliente_id?: string
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          id?: string
          ordem?: number
          responsavel?: Database["public"]["Enums"]["checklist_responsavel"]
          tarefa?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklist_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cliente_id: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          org_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_audio: {
        Row: {
          arquivo_id: string
          cliente_id: string
          concluido: boolean
          id: string
          posicao_segundos: number
          updated_at: string
        }
        Insert: {
          arquivo_id: string
          cliente_id: string
          concluido?: boolean
          id?: string
          posicao_segundos?: number
          updated_at?: string
        }
        Update: {
          arquivo_id?: string
          cliente_id?: string
          concluido?: boolean
          id?: string
          posicao_segundos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_audio_arquivo_id_fkey"
            columns: ["arquivo_id"]
            isOneToOne: false
            referencedRelation: "arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_audio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          categoria: string
          conteudo: string
          created_at: string
          criado_por: string | null
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          conteudo: string
          created_at?: string
          criado_por?: string | null
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      referencias: {
        Row: {
          categoria: string
          created_at: string
          criado_por: string | null
          descricao: string | null
          id: string
          titulo: string
          updated_at: string
          url: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          titulo: string
          updated_at?: string
          url: string
        }
        Update: {
          categoria?: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          titulo?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      saidas_financeiras: {
        Row: {
          categoria: string | null
          created_at: string
          data_ref: string
          descricao: string
          id: string
          recorrente: boolean
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_ref?: string
          descricao: string
          id?: string
          recorrente?: boolean
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_ref?: string
          descricao?: string
          id?: string
          recorrente?: boolean
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      solicitacoes_cadastro: {
        Row: {
          auth_user_id: string
          cliente_id: string | null
          created_at: string
          email: string
          id: string
          nome: string
          observacao: string | null
          status: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          cliente_id?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          observacao?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          cliente_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          observacao?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_cadastro_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          name: string
          org_id: string | null
          start_date: string | null
          status: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          org_id?: string | null
          start_date?: string | null
          status: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          org_id?: string | null
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suporte_tickets: {
        Row: {
          assunto: string
          cliente_id: string
          created_by: string | null
          data_abertura: string
          data_resolucao: string | null
          descricao: string | null
          id: string
          prioridade: Database["public"]["Enums"]["ticket_prioridade"]
          status: Database["public"]["Enums"]["ticket_status"]
        }
        Insert: {
          assunto: string
          cliente_id: string
          created_by?: string | null
          data_abertura?: string
          data_resolucao?: string | null
          descricao?: string | null
          id?: string
          prioridade?: Database["public"]["Enums"]["ticket_prioridade"]
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Update: {
          assunto?: string
          cliente_id?: string
          created_by?: string | null
          data_abertura?: string
          data_resolucao?: string | null
          descricao?: string | null
          id?: string
          prioridade?: Database["public"]["Enums"]["ticket_prioridade"]
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Relationships: [
          {
            foreignKeyName: "suporte_tickets_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tarefa_comentarios: {
        Row: {
          autor_id: string | null
          conteudo: string
          created_at: string
          id: string
          tarefa_id: string
        }
        Insert: {
          autor_id?: string | null
          conteudo: string
          created_at?: string
          id?: string
          tarefa_id: string
        }
        Update: {
          autor_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          tarefa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_comentarios_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          arquivo_url: string | null
          assignee_id: string | null
          cliente_id: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          id: string
          org_id: string | null
          prazo: string | null
          prioridade: string
          sprint_id: string | null
          status: string
          tempo_total_segundos: number
          timer_iniciado_em: string | null
          timer_status: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_url?: string | null
          assignee_id?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          org_id?: string | null
          prazo?: string | null
          prioridade?: string
          sprint_id?: string | null
          status?: string
          tempo_total_segundos?: number
          timer_iniciado_em?: string | null
          timer_status?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string | null
          assignee_id?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          org_id?: string | null
          prazo?: string | null
          prioridade?: string
          sprint_id?: string | null
          status?: string
          tempo_total_segundos?: number
          timer_iniciado_em?: string | null
          timer_status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          tag_id: string
          task_id: string
        }
        Insert: {
          tag_id: string
          task_id: string
        }
        Update: {
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      topicos_fase: {
        Row: {
          created_at: string | null
          fase_id: number
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          created_at?: string | null
          fase_id: number
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          created_at?: string | null
          fase_id?: number
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "topicos_fase_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "fases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_connections: {
        Row: {
          access_token: string
          created_at: string
          display_phone_number: string | null
          id: string
          org_id: string | null
          phone_number_id: string
          updated_at: string
          user_id: string
          verified_name: string | null
          waba_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          display_phone_number?: string | null
          id?: string
          org_id?: string | null
          phone_number_id: string
          updated_at?: string
          user_id: string
          verified_name?: string | null
          waba_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          display_phone_number?: string | null
          id?: string
          org_id?: string | null
          phone_number_id?: string
          updated_at?: string
          user_id?: string
          verified_name?: string | null
          waba_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_envios: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          delivered_at: string | null
          delivery_status: string | null
          error_message: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          language_code: string
          meta_message_id: string | null
          org_id: string | null
          read_at: string | null
          status: string
          template_name: string
          to_phone: string
          user_id: string
          valor_cobrado: number | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          language_code?: string
          meta_message_id?: string | null
          org_id?: string | null
          read_at?: string | null
          status: string
          template_name: string
          to_phone: string
          user_id: string
          valor_cobrado?: number | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          language_code?: string
          meta_message_id?: string | null
          org_id?: string | null
          read_at?: string | null
          status?: string
          template_name?: string
          to_phone?: string
          user_id?: string
          valor_cobrado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_envios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_envios_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_cliente_id: { Args: never; Returns: string }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "cliente"
        | "gestor"
        | "editor"
        | "social"
        | "financeiro"
        | "juridico"
      arquivo_contexto:
        | "central_cliente"
        | "onboarding_sistema"
        | "tarefa"
        | "recurso_marca"
        | "documento_juridico"
        | "geral"
      arquivo_tipo:
        | "audio"
        | "video"
        | "documento"
        | "imagem"
        | "design"
        | "outro"
      checklist_responsavel: "admin" | "cliente"
      fin_categoria:
        | "assinatura_ferramenta"
        | "pro_labore"
        | "impostos"
        | "outro"
      fin_status: "pendente" | "pago"
      fin_tipo: "entrada" | "saida"
      forma_pagamento: "pix" | "boleto" | "cartao_recorrente"
      plano_atual: "basico" | "intermediario" | "avancado"
      status_contrato: "ativo" | "pendente_assinatura" | "vencido" | "cancelado"
      ticket_prioridade: "baixa" | "media" | "alta_urgente"
      ticket_status: "aberto" | "em_analise" | "resolvido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "cliente",
        "gestor",
        "editor",
        "social",
        "financeiro",
        "juridico",
      ],
      arquivo_contexto: [
        "central_cliente",
        "onboarding_sistema",
        "tarefa",
        "recurso_marca",
        "documento_juridico",
        "geral",
      ],
      arquivo_tipo: [
        "audio",
        "video",
        "documento",
        "imagem",
        "design",
        "outro",
      ],
      checklist_responsavel: ["admin", "cliente"],
      fin_categoria: [
        "assinatura_ferramenta",
        "pro_labore",
        "impostos",
        "outro",
      ],
      fin_status: ["pendente", "pago"],
      fin_tipo: ["entrada", "saida"],
      forma_pagamento: ["pix", "boleto", "cartao_recorrente"],
      plano_atual: ["basico", "intermediario", "avancado"],
      status_contrato: ["ativo", "pendente_assinatura", "vencido", "cancelado"],
      ticket_prioridade: ["baixa", "media", "alta_urgente"],
      ticket_status: ["aberto", "em_analise", "resolvido"],
    },
  },
} as const
