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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
          {
            foreignKeyName: "arquivos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendario_estrategico_itens: {
        Row: {
          argumento_id: string | null
          canal: string | null
          cliente_id: string
          created_at: string
          cta: string | null
          data: string
          formato: string | null
          id: string
          jornada: string | null
          mensagem_id: string | null
          objetivo: string | null
          org_id: string
          pilar_id: string | null
          tema_id: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          argumento_id?: string | null
          canal?: string | null
          cliente_id: string
          created_at?: string
          cta?: string | null
          data: string
          formato?: string | null
          id?: string
          jornada?: string | null
          mensagem_id?: string | null
          objetivo?: string | null
          org_id?: string
          pilar_id?: string | null
          tema_id?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          argumento_id?: string | null
          canal?: string | null
          cliente_id?: string
          created_at?: string
          cta?: string | null
          data?: string
          formato?: string | null
          id?: string
          jornada?: string | null
          mensagem_id?: string | null
          objetivo?: string | null
          org_id?: string
          pilar_id?: string | null
          tema_id?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendario_estrategico_itens_argumento_id_fkey"
            columns: ["argumento_id"]
            isOneToOne: false
            referencedRelation: "editorial_argumentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendario_estrategico_itens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendario_estrategico_itens_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "editorial_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendario_estrategico_itens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendario_estrategico_itens_pilar_id_fkey"
            columns: ["pilar_id"]
            isOneToOne: false
            referencedRelation: "editorial_pilares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendario_estrategico_itens_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "editorial_temas"
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
      contas_fixas: {
        Row: {
          ativo: boolean
          categoria: string | null
          cliente_id: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number
          frequencia: string
          id: string
          org_id: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number
          frequencia?: string
          id?: string
          org_id?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          dia_vencimento?: number
          frequencia?: string
          id?: string
          org_id?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_fixas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_fixas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_comentarios: {
        Row: {
          alvo: string
          autor_id: string | null
          cliente_id: string
          conteudo_id: string
          created_at: string
          id: string
          org_id: string
          texto: string
          tipo: string
          versao_id: string | null
        }
        Insert: {
          alvo?: string
          autor_id?: string | null
          cliente_id: string
          conteudo_id: string
          created_at?: string
          id?: string
          org_id: string
          texto: string
          tipo?: string
          versao_id?: string | null
        }
        Update: {
          alvo?: string
          autor_id?: string | null
          cliente_id?: string
          conteudo_id?: string
          created_at?: string
          id?: string
          org_id?: string
          texto?: string
          tipo?: string
          versao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_comentarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudo_comentarios_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudo_comentarios_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudo_comentarios_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "conteudo_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_eventos: {
        Row: {
          autor_id: string | null
          conteudo_id: string
          created_at: string
          de: string | null
          detalhe: string | null
          id: string
          org_id: string
          para: string | null
          tipo: string
        }
        Insert: {
          autor_id?: string | null
          conteudo_id: string
          created_at?: string
          de?: string | null
          detalhe?: string | null
          id?: string
          org_id: string
          para?: string | null
          tipo: string
        }
        Update: {
          autor_id?: string | null
          conteudo_id?: string
          created_at?: string
          de?: string | null
          detalhe?: string | null
          id?: string
          org_id?: string
          para?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_eventos_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudo_eventos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_midias: {
        Row: {
          bucket: string
          conteudo_id: string
          created_at: string
          id: string
          mime: string | null
          nome_original: string | null
          ordem: number
          org_id: string
          storage_path: string
          tamanho_bytes: number | null
          tipo: string
        }
        Insert: {
          bucket?: string
          conteudo_id: string
          created_at?: string
          id?: string
          mime?: string | null
          nome_original?: string | null
          ordem?: number
          org_id: string
          storage_path: string
          tamanho_bytes?: number | null
          tipo: string
        }
        Update: {
          bucket?: string
          conteudo_id?: string
          created_at?: string
          id?: string
          mime?: string | null
          nome_original?: string | null
          ordem?: number
          org_id?: string
          storage_path?: string
          tamanho_bytes?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_midias_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudo_midias_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_versoes: {
        Row: {
          conteudo_id: string
          created_at: string
          enviada_em: string
          enviada_por: string | null
          hashtags: string | null
          id: string
          legenda: string | null
          midias: Json
          numero: number
          org_id: string
          recebida_em: string | null
          recebida_por: string | null
          status: string
          status_arte: string
          status_legenda: string
        }
        Insert: {
          conteudo_id: string
          created_at?: string
          enviada_em?: string
          enviada_por?: string | null
          hashtags?: string | null
          id?: string
          legenda?: string | null
          midias?: Json
          numero: number
          org_id: string
          recebida_em?: string | null
          recebida_por?: string | null
          status?: string
          status_arte?: string
          status_legenda?: string
        }
        Update: {
          conteudo_id?: string
          created_at?: string
          enviada_em?: string
          enviada_por?: string | null
          hashtags?: string | null
          id?: string
          legenda?: string | null
          midias?: Json
          numero?: number
          org_id?: string
          recebida_em?: string | null
          recebida_por?: string | null
          status?: string
          status_arte?: string
          status_legenda?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_versoes_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudo_versoes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudos: {
        Row: {
          argumento_id: string | null
          calendario_item_id: string | null
          canal: string | null
          cliente_id: string
          created_at: string
          created_by: string | null
          cta: string | null
          data_prevista: string | null
          enviado_cliente_em: string | null
          evidencia_id: string | null
          formato: string | null
          hashtags: string | null
          horario: string | null
          id: string
          jornada: string | null
          legenda: string | null
          mensagem_id: string | null
          objetivo: string | null
          org_id: string
          origem: string
          pilar_id: string | null
          pipeline_mes: string | null
          plataforma: string | null
          plataforma_post_id: string | null
          publicacao_url: string | null
          publicado_em: string | null
          status: string
          status_arte: string
          status_legenda: string
          tema_id: string | null
          titulo: string
          updated_at: string
          versao_atual: number
        }
        Insert: {
          argumento_id?: string | null
          calendario_item_id?: string | null
          canal?: string | null
          cliente_id: string
          created_at?: string
          created_by?: string | null
          cta?: string | null
          data_prevista?: string | null
          enviado_cliente_em?: string | null
          evidencia_id?: string | null
          formato?: string | null
          hashtags?: string | null
          horario?: string | null
          id?: string
          jornada?: string | null
          legenda?: string | null
          mensagem_id?: string | null
          objetivo?: string | null
          org_id: string
          origem?: string
          pilar_id?: string | null
          pipeline_mes?: string | null
          plataforma?: string | null
          plataforma_post_id?: string | null
          publicacao_url?: string | null
          publicado_em?: string | null
          status?: string
          status_arte?: string
          status_legenda?: string
          tema_id?: string | null
          titulo?: string
          updated_at?: string
          versao_atual?: number
        }
        Update: {
          argumento_id?: string | null
          calendario_item_id?: string | null
          canal?: string | null
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          cta?: string | null
          data_prevista?: string | null
          enviado_cliente_em?: string | null
          evidencia_id?: string | null
          formato?: string | null
          hashtags?: string | null
          horario?: string | null
          id?: string
          jornada?: string | null
          legenda?: string | null
          mensagem_id?: string | null
          objetivo?: string | null
          org_id?: string
          origem?: string
          pilar_id?: string | null
          pipeline_mes?: string | null
          plataforma?: string | null
          plataforma_post_id?: string | null
          publicacao_url?: string | null
          publicado_em?: string | null
          status?: string
          status_arte?: string
          status_legenda?: string
          tema_id?: string | null
          titulo?: string
          updated_at?: string
          versao_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_argumento_id_fkey"
            columns: ["argumento_id"]
            isOneToOne: false
            referencedRelation: "editorial_argumentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_calendario_item_id_fkey"
            columns: ["calendario_item_id"]
            isOneToOne: false
            referencedRelation: "calendario_estrategico_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_evidencia_id_fkey"
            columns: ["evidencia_id"]
            isOneToOne: false
            referencedRelation: "estrategia_evidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "editorial_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_pilar_id_fkey"
            columns: ["pilar_id"]
            isOneToOne: false
            referencedRelation: "editorial_pilares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "editorial_temas"
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
            foreignKeyName: "conteudos_cliente_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      conteudos_globais: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          ordem: number
          storage_bucket: string | null
          storage_path: string | null
          tipo: string
          titulo: string | null
          topico_id: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          storage_bucket?: string | null
          storage_path?: string | null
          tipo: string
          titulo?: string | null
          topico_id: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          storage_bucket?: string | null
          storage_path?: string | null
          tipo?: string
          titulo?: string | null
          topico_id?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_globais_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topicos_fase"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudos_internos: {
        Row: {
          conteudo_id: string
          observacoes: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          conteudo_id: string
          observacoes?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          conteudo_id?: string
          observacoes?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_internos_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: true
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_internos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string
          publico: boolean
          tipo: string | null
          url: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          nome: string
          org_id?: string
          publico?: boolean
          tipo?: string | null
          url: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          org_id?: string
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
          {
            foreignKeyName: "documentos_juridicos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_argumentos: {
        Row: {
          argumento: string
          cliente_id: string
          created_at: string
          evidencia_id: string | null
          id: string
          mensagem_id: string
          org_id: string
          prova: string | null
          updated_at: string
        }
        Insert: {
          argumento: string
          cliente_id: string
          created_at?: string
          evidencia_id?: string | null
          id?: string
          mensagem_id: string
          org_id?: string
          prova?: string | null
          updated_at?: string
        }
        Update: {
          argumento?: string
          cliente_id?: string
          created_at?: string
          evidencia_id?: string | null
          id?: string
          mensagem_id?: string
          org_id?: string
          prova?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_argumentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_argumentos_evidencia_id_fkey"
            columns: ["evidencia_id"]
            isOneToOne: false
            referencedRelation: "estrategia_evidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_argumentos_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "editorial_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_argumentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_mensagens: {
        Row: {
          cliente_id: string
          created_at: string
          cta: string | null
          formatos: string[]
          id: string
          jornada: string | null
          mensagem: string
          objetivo_psicologico: string | null
          org_id: string
          tema_id: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          cta?: string | null
          formatos?: string[]
          id?: string
          jornada?: string | null
          mensagem: string
          objetivo_psicologico?: string | null
          org_id?: string
          tema_id: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          cta?: string | null
          formatos?: string[]
          id?: string
          jornada?: string | null
          mensagem?: string
          objetivo_psicologico?: string | null
          org_id?: string
          tema_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_mensagens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_mensagens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_mensagens_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "editorial_temas"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_pilares: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          org_id: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          org_id?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_pilares_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_pilares_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_temas: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          org_id: string
          pilar_id: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          org_id?: string
          pilar_id: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          org_id?: string
          pilar_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_temas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_temas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_temas_pilar_id_fkey"
            columns: ["pilar_id"]
            isOneToOne: false
            referencedRelation: "editorial_pilares"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas_financeiras: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          conta_fixa_id: string | null
          created_at: string
          data_ref: string
          descricao: string
          fixed_template_id: string | null
          id: string
          is_fixed: boolean
          org_id: string
          recurrence_day: number | null
          status_pagamento: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          conta_fixa_id?: string | null
          created_at?: string
          data_ref?: string
          descricao: string
          fixed_template_id?: string | null
          id?: string
          is_fixed?: boolean
          org_id?: string
          recurrence_day?: number | null
          status_pagamento?: string
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          conta_fixa_id?: string | null
          created_at?: string
          data_ref?: string
          descricao?: string
          fixed_template_id?: string | null
          id?: string
          is_fixed?: boolean
          org_id?: string
          recurrence_day?: number | null
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
          {
            foreignKeyName: "entradas_financeiras_conta_fixa_id_fkey"
            columns: ["conta_fixa_id"]
            isOneToOne: false
            referencedRelation: "contas_fixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entradas_financeiras_fixed_template_id_fkey"
            columns: ["fixed_template_id"]
            isOneToOne: false
            referencedRelation: "entradas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entradas_financeiras_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_achado_evidencias: {
        Row: {
          achado_id: string
          cliente_id: string
          created_at: string
          evidencia_id: string
          org_id: string
        }
        Insert: {
          achado_id: string
          cliente_id: string
          created_at?: string
          evidencia_id: string
          org_id?: string
        }
        Update: {
          achado_id?: string
          cliente_id?: string
          created_at?: string
          evidencia_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_achado_evidencias_achado_id_fkey"
            columns: ["achado_id"]
            isOneToOne: false
            referencedRelation: "estrategia_achados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_achado_evidencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_achado_evidencias_evidencia_id_fkey"
            columns: ["evidencia_id"]
            isOneToOne: false
            referencedRelation: "estrategia_evidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_achado_evidencias_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_achados: {
        Row: {
          cliente_id: string
          created_at: string
          deriva_de: string | null
          descricao: string | null
          etapa: number
          id: string
          org_id: string
          origem: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          deriva_de?: string | null
          descricao?: string | null
          etapa: number
          id?: string
          org_id?: string
          origem?: string
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          deriva_de?: string | null
          descricao?: string | null
          etapa?: number
          id?: string
          org_id?: string
          origem?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_achados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_achados_deriva_de_fkey"
            columns: ["deriva_de"]
            isOneToOne: false
            referencedRelation: "estrategia_achados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_achados_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_briefing: {
        Row: {
          cliente_id: string
          lacunas: string | null
          mapa: Json
          org_id: string
          scores: Json
          updated_at: string
        }
        Insert: {
          cliente_id: string
          lacunas?: string | null
          mapa?: Json
          org_id?: string
          scores?: Json
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          lacunas?: string | null
          mapa?: Json
          org_id?: string
          scores?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_briefing_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_briefing_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_concorrentes: {
        Row: {
          cliente_id: string
          comunicacao: string | null
          conteudo: string | null
          created_at: string
          diferenciais: string | null
          id: string
          nome: string
          oferta: string | null
          oportunidades: string | null
          org_id: string
          posicionamento: string | null
          preco: string | null
          provas: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          comunicacao?: string | null
          conteudo?: string | null
          created_at?: string
          diferenciais?: string | null
          id?: string
          nome: string
          oferta?: string | null
          oportunidades?: string | null
          org_id?: string
          posicionamento?: string | null
          preco?: string | null
          provas?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          comunicacao?: string | null
          conteudo?: string | null
          created_at?: string
          diferenciais?: string | null
          id?: string
          nome?: string
          oferta?: string | null
          oportunidades?: string | null
          org_id?: string
          posicionamento?: string | null
          preco?: string | null
          provas?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_concorrentes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_concorrentes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_definicoes: {
        Row: {
          campo: string
          cliente_id: string
          created_at: string
          etapa: number
          id: string
          org_id: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          campo: string
          cliente_id: string
          created_at?: string
          etapa: number
          id?: string
          org_id?: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          campo?: string
          cliente_id?: string
          created_at?: string
          etapa?: number
          id?: string
          org_id?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_definicoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_definicoes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_etapas: {
        Row: {
          cliente_id: string
          concluido_em: string | null
          created_at: string
          etapa: number
          id: string
          iniciado_em: string | null
          metadados: Json
          org_id: string
          progresso: number | null
          status: Database["public"]["Enums"]["estrategia_etapa_status"]
          updated_at: string
        }
        Insert: {
          cliente_id: string
          concluido_em?: string | null
          created_at?: string
          etapa: number
          id?: string
          iniciado_em?: string | null
          metadados?: Json
          org_id?: string
          progresso?: number | null
          status?: Database["public"]["Enums"]["estrategia_etapa_status"]
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          concluido_em?: string | null
          created_at?: string
          etapa?: number
          id?: string
          iniciado_em?: string | null
          metadados?: Json
          org_id?: string
          progresso?: number | null
          status?: Database["public"]["Enums"]["estrategia_etapa_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_etapas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_etapas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_evidencias: {
        Row: {
          categoria: string | null
          classificacao: string
          cliente_id: string
          created_at: string
          data_ref: string | null
          etapa: number | null
          evidencia: string | null
          fonte_id: string | null
          id: string
          informacao: string
          muda: string | null
          observacao: string | null
          org_id: string
          origem: string | null
          updated_at: string
          validar: string | null
        }
        Insert: {
          categoria?: string | null
          classificacao?: string
          cliente_id: string
          created_at?: string
          data_ref?: string | null
          etapa?: number | null
          evidencia?: string | null
          fonte_id?: string | null
          id?: string
          informacao: string
          muda?: string | null
          observacao?: string | null
          org_id?: string
          origem?: string | null
          updated_at?: string
          validar?: string | null
        }
        Update: {
          categoria?: string | null
          classificacao?: string
          cliente_id?: string
          created_at?: string
          data_ref?: string | null
          etapa?: number | null
          evidencia?: string | null
          fonte_id?: string | null
          id?: string
          informacao?: string
          muda?: string | null
          observacao?: string | null
          org_id?: string
          origem?: string | null
          updated_at?: string
          validar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_evidencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_evidencias_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "estrategia_fontes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_evidencias_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_fontes: {
        Row: {
          cliente_id: string
          created_at: string
          data_ref: string | null
          etapa: number
          id: string
          nome: string
          observacoes: string | null
          org_id: string
          status: string
          tipo: string
          updated_at: string
          url: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_ref?: string | null
          etapa: number
          id?: string
          nome: string
          observacoes?: string | null
          org_id?: string
          status?: string
          tipo?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_ref?: string | null
          etapa?: number
          id?: string
          nome?: string
          observacoes?: string | null
          org_id?: string
          status?: string
          tipo?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_fontes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_fontes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_sugestoes_ia: {
        Row: {
          cliente_id: string
          conteudo: string
          created_at: string
          etapa: number | null
          id: string
          org_id: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          conteudo: string
          created_at?: string
          etapa?: number | null
          id?: string
          org_id?: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          conteudo?: string
          created_at?: string
          etapa?: number | null
          id?: string
          org_id?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_sugestoes_ia_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estrategia_sugestoes_ia_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
          {
            foreignKeyName: "estrategias_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ferramentas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
          {
            foreignKeyName: "financas_administrativas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
        Relationships: [
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
          {
            foreignKeyName: "onboarding_checklist_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      pipeline_status: {
        Row: {
          cliente_id: string
          created_at: string
          etapa: Database["public"]["Enums"]["pipeline_etapa"]
          id: string
          mes: string
          org_id: string
          status: Database["public"]["Enums"]["pipeline_status_valor"]
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          etapa: Database["public"]["Enums"]["pipeline_etapa"]
          id?: string
          mes: string
          org_id: string
          status?: Database["public"]["Enums"]["pipeline_status_valor"]
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          etapa?: Database["public"]["Enums"]["pipeline_etapa"]
          id?: string
          mes?: string
          org_id?: string
          status?: Database["public"]["Enums"]["pipeline_status_valor"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_status_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_status_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string
          posicao_segundos: number
          updated_at: string
        }
        Insert: {
          arquivo_id: string
          cliente_id: string
          concluido?: boolean
          id?: string
          org_id?: string
          posicao_segundos?: number
          updated_at?: string
        }
        Update: {
          arquivo_id?: string
          cliente_id?: string
          concluido?: boolean
          id?: string
          org_id?: string
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
          {
            foreignKeyName: "progresso_audio_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          conteudo: string
          created_at?: string
          criado_por?: string | null
          id?: string
          org_id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          org_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referencias: {
        Row: {
          categoria: string
          created_at: string
          criado_por: string | null
          descricao: string | null
          id: string
          org_id: string
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
          org_id?: string
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
          org_id?: string
          titulo?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "referencias_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saidas_financeiras: {
        Row: {
          categoria: string | null
          conta_fixa_id: string | null
          created_at: string
          data_ref: string
          descricao: string
          fixed_template_id: string | null
          id: string
          is_fixed: boolean
          org_id: string
          recorrente: boolean
          recurrence_day: number | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          conta_fixa_id?: string | null
          created_at?: string
          data_ref?: string
          descricao: string
          fixed_template_id?: string | null
          id?: string
          is_fixed?: boolean
          org_id?: string
          recorrente?: boolean
          recurrence_day?: number | null
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          conta_fixa_id?: string | null
          created_at?: string
          data_ref?: string
          descricao?: string
          fixed_template_id?: string | null
          id?: string
          is_fixed?: boolean
          org_id?: string
          recorrente?: boolean
          recurrence_day?: number | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "saidas_financeiras_conta_fixa_id_fkey"
            columns: ["conta_fixa_id"]
            isOneToOne: false
            referencedRelation: "contas_fixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saidas_financeiras_fixed_template_id_fkey"
            columns: ["fixed_template_id"]
            isOneToOne: false
            referencedRelation: "saidas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saidas_financeiras_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          client_id: string
          connection_type: string
          created_at: string
          id: string
          org_id: string
          platform: string
          username: string | null
        }
        Insert: {
          access_token?: string | null
          client_id: string
          connection_type?: string
          created_at?: string
          id?: string
          org_id?: string
          platform: string
          username?: string | null
        }
        Update: {
          access_token?: string | null
          client_id?: string
          connection_type?: string
          created_at?: string
          id?: string
          org_id?: string
          platform?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_goals: {
        Row: {
          created_at: string
          id: string
          metric: string
          social_account_id: string
          target_date: string | null
          target_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: string
          social_account_id: string
          target_date?: string | null
          target_value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          social_account_id?: string
          target_date?: string | null
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_goals_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_metrics_snapshots: {
        Row: {
          created_at: string
          engagement_rate: number | null
          followers: number | null
          id: string
          impressions: number | null
          reach: number | null
          snapshot_date: string
          social_account_id: string
          source: string
        }
        Insert: {
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          impressions?: number | null
          reach?: number | null
          snapshot_date: string
          social_account_id: string
          source?: string
        }
        Update: {
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          impressions?: number | null
          reach?: number | null
          snapshot_date?: string
          social_account_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_metrics_snapshots_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
          {
            foreignKeyName: "solicitacoes_cadastro_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string
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
          org_id?: string
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
          org_id?: string
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
          {
            foreignKeyName: "suporte_tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          org_id?: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      estrategia_etapa_status:
        | "nao_iniciada"
        | "em_andamento"
        | "revisar"
        | "concluida"
      fin_categoria:
        | "assinatura_ferramenta"
        | "pro_labore"
        | "impostos"
        | "outro"
      fin_status: "pendente" | "pago"
      fin_tipo: "entrada" | "saida"
      forma_pagamento: "pix" | "boleto" | "cartao_recorrente"
      pipeline_etapa:
        | "estrategia"
        | "linha_editorial"
        | "design"
        | "copy"
        | "metricas"
      pipeline_status_valor:
        | "nao_iniciado"
        | "em_andamento"
        | "concluido"
        | "travado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      estrategia_etapa_status: [
        "nao_iniciada",
        "em_andamento",
        "revisar",
        "concluida",
      ],
      fin_categoria: [
        "assinatura_ferramenta",
        "pro_labore",
        "impostos",
        "outro",
      ],
      fin_status: ["pendente", "pago"],
      fin_tipo: ["entrada", "saida"],
      forma_pagamento: ["pix", "boleto", "cartao_recorrente"],
      pipeline_etapa: [
        "estrategia",
        "linha_editorial",
        "design",
        "copy",
        "metricas",
      ],
      pipeline_status_valor: [
        "nao_iniciado",
        "em_andamento",
        "concluido",
        "travado",
      ],
      plano_atual: ["basico", "intermediario", "avancado"],
      status_contrato: ["ativo", "pendente_assinatura", "vencido", "cancelado"],
      ticket_prioridade: ["baixa", "media", "alta_urgente"],
      ticket_status: ["aberto", "em_analise", "resolvido"],
    },
  },
} as const
