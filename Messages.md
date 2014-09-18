## RpbErrorResp

- errmsg
  - type: bytes
  - rule: required
- errcode
  - type: uint32
  - rule: required

## RpbGetServerInfoResp

- node
  - type: bytes
  - rule: optional
- server_version
  - type: bytes
  - rule: optional

## RpbPair

- key
  - type: bytes
  - rule: required
- value
  - type: bytes
  - rule: optional

## RpbGetBucketReq

- bucket
  - type: bytes
  - rule: required
- type
  - type: bytes
  - rule: optional

## RpbGetBucketResp

- props
  - type: [RpbBucketProps](#rpbbucketprops)
  - rule: required

## RpbSetBucketReq

- bucket
  - type: bytes
  - rule: required
- props
  - type: [RpbBucketProps](#rpbbucketprops)
  - rule: required
- type
  - type: bytes
  - rule: optional

## RpbResetBucketReq

- bucket
  - type: bytes
  - rule: required
- type
  - type: bytes
  - rule: optional

## RpbGetBucketTypeReq

- type
  - type: bytes
  - rule: required

## RpbSetBucketTypeReq

- type
  - type: bytes
  - rule: required
- props
  - type: [RpbBucketProps](#rpbbucketprops)
  - rule: required

## RpbModFun

- module
  - type: bytes
  - rule: required
- function
  - type: bytes
  - rule: required

## RpbCommitHook

- modfun
  - type: [RpbModFun](#rpbmodfun)
  - rule: optional
- name
  - type: bytes
  - rule: optional

## RpbBucketProps

- n_val
  - type: uint32
  - rule: optional
- allow_mult
  - type: bool
  - rule: optional
- last_write_wins
  - type: bool
  - rule: optional
- precommit
  - type: [RpbCommitHook](#rpbcommithook)
  - rule: repeated
- has_precommit
  - type: bool
  - rule: optional
- postcommit
  - type: [RpbCommitHook](#rpbcommithook)
  - rule: repeated
- has_postcommit
  - type: bool
  - rule: optional
- chash_keyfun
  - type: [RpbModFun](#rpbmodfun)
  - rule: optional
- linkfun
  - type: [RpbModFun](#rpbmodfun)
  - rule: optional
- old_vclock
  - type: uint32
  - rule: optional
- young_vclock
  - type: uint32
  - rule: optional
- big_vclock
  - type: uint32
  - rule: optional
- small_vclock
  - type: uint32
  - rule: optional
- pr
  - type: uint32
  - rule: optional
- r
  - type: uint32
  - rule: optional
- w
  - type: uint32
  - rule: optional
- pw
  - type: uint32
  - rule: optional
- dw
  - type: uint32
  - rule: optional
- rw
  - type: uint32
  - rule: optional
- basic_quorum
  - type: bool
  - rule: optional
- notfound_ok
  - type: bool
  - rule: optional
- backend
  - type: bytes
  - rule: optional
- search
  - type: bool
  - rule: optional
- repl
  - type: [RpbReplMode](#rpbreplmode)
  - rule: optional
- search_index
  - type: bytes
  - rule: optional
- datatype
  - type: bytes
  - rule: optional
- consistent
  - type: bool
  - rule: optional

## RpbAuthReq

- user
  - type: bytes
  - rule: required
- password
  - type: bytes
  - rule: required

## MapField

- name
  - type: bytes
  - rule: required
- type
  - type: [MapFieldType](#mapfieldtype)
  - rule: required

## MapEntry

- field
  - type: [MapField](#mapfield)
  - rule: required
- counter_value
  - type: sint64
  - rule: optional
- set_value
  - type: bytes
  - rule: repeated
- register_value
  - type: bytes
  - rule: optional
- flag_value
  - type: bool
  - rule: optional
- map_value
  - type: [MapEntry](#mapentry)
  - rule: repeated

## DtFetchReq

- bucket
  - type: bytes
  - rule: required
- key
  - type: bytes
  - rule: required
- type
  - type: bytes
  - rule: required
- r
  - type: uint32
  - rule: optional
- pr
  - type: uint32
  - rule: optional
- basic_quorum
  - type: bool
  - rule: optional
- notfound_ok
  - type: bool
  - rule: optional
- timeout
  - type: uint32
  - rule: optional
- sloppy_quorum
  - type: bool
  - rule: optional
- n_val
  - type: uint32
  - rule: optional
- include_context
  - type: bool
  - rule: optional

## DtValue

- counter_value
  - type: sint64
  - rule: optional
- set_value
  - type: bytes
  - rule: repeated
- map_value
  - type: [MapEntry](#mapentry)
  - rule: repeated

## DtFetchResp

- context
  - type: bytes
  - rule: optional
- type
  - type: [DataType](#datatype)
  - rule: required
- value
  - type: [DtValue](#dtvalue)
  - rule: optional

## CounterOp

- increment
  - type: sint64
  - rule: optional

## SetOp

- adds
  - type: bytes
  - rule: repeated
- removes
  - type: bytes
  - rule: repeated

## MapUpdate

- field
  - type: [MapField](#mapfield)
  - rule: required
- counter_op
  - type: [CounterOp](#counterop)
  - rule: optional
- set_op
  - type: [SetOp](#setop)
  - rule: optional
- register_op
  - type: bytes
  - rule: optional
- flag_op
  - type: [FlagOp](#flagop)
  - rule: optional
- map_op
  - type: [MapOp](#mapop)
  - rule: optional

## MapOp

- removes
  - type: [MapField](#mapfield)
  - rule: repeated
- updates
  - type: [MapUpdate](#mapupdate)
  - rule: repeated

## DtOp

- counter_op
  - type: [CounterOp](#counterop)
  - rule: optional
- set_op
  - type: [SetOp](#setop)
  - rule: optional
- map_op
  - type: [MapOp](#mapop)
  - rule: optional

## DtUpdateReq

- bucket
  - type: bytes
  - rule: required
- key
  - type: bytes
  - rule: optional
- type
  - type: bytes
  - rule: required
- context
  - type: bytes
  - rule: optional
- op
  - type: [DtOp](#dtop)
  - rule: required
- w
  - type: uint32
  - rule: optional
- dw
  - type: uint32
  - rule: optional
- pw
  - type: uint32
  - rule: optional
- return_body
  - type: bool
  - rule: optional
- timeout
  - type: uint32
  - rule: optional
- sloppy_quorum
  - type: bool
  - rule: optional
- n_val
  - type: uint32
  - rule: optional
- include_context
  - type: bool
  - rule: optional

## DtUpdateResp

- key
  - type: bytes
  - rule: optional
- context
  - type: bytes
  - rule: optional
- counter_value
  - type: sint64
  - rule: optional
- set_value
  - type: bytes
  - rule: repeated
- map_value
  - type: [MapEntry](#mapentry)
  - rule: repeated

## RpbGetClientIdResp

- client_id
  - type: bytes
  - rule: required

## RpbSetClientIdReq

- client_id
  - type: bytes
  - rule: required

## RpbGetReq

- bucket
  - type: bytes
  - rule: required
- key
  - type: bytes
  - rule: required
- r
  - type: uint32
  - rule: optional
- pr
  - type: uint32
  - rule: optional
- basic_quorum
  - type: bool
  - rule: optional
- notfound_ok
  - type: bool
  - rule: optional
- if_modified
  - type: bytes
  - rule: optional
- head
  - type: bool
  - rule: optional
- deletedvclock
  - type: bool
  - rule: optional
- timeout
  - type: uint32
  - rule: optional
- sloppy_quorum
  - type: bool
  - rule: optional
- n_val
  - type: uint32
  - rule: optional
- type
  - type: bytes
  - rule: optional

## RpbGetResp

- content
  - type: [RpbContent](#rpbcontent)
  - rule: repeated
- vclock
  - type: bytes
  - rule: optional
- unchanged
  - type: bool
  - rule: optional

## RpbPutReq

- bucket
  - type: bytes
  - rule: required
- key
  - type: bytes
  - rule: optional
- vclock
  - type: bytes
  - rule: optional
- content
  - type: [RpbContent](#rpbcontent)
  - rule: required
- w
  - type: uint32
  - rule: optional
- dw
  - type: uint32
  - rule: optional
- return_body
  - type: bool
  - rule: optional
- pw
  - type: uint32
  - rule: optional
- if_not_modified
  - type: bool
  - rule: optional
- if_none_match
  - type: bool
  - rule: optional
- return_head
  - type: bool
  - rule: optional
- timeout
  - type: uint32
  - rule: optional
- asis
  - type: bool
  - rule: optional
- sloppy_quorum
  - type: bool
  - rule: optional
- n_val
  - type: uint32
  - rule: optional
- type
  - type: bytes
  - rule: optional

## RpbPutResp

- content
  - type: [RpbContent](#rpbcontent)
  - rule: repeated
- vclock
  - type: bytes
  - rule: optional
- key
  - type: bytes
  - rule: optional

## RpbDelReq

- bucket
  - type: bytes
  - rule: required
- key
  - type: bytes
  - rule: required
- rw
  - type: uint32
  - rule: optional
- vclock
  - type: bytes
  - rule: optional
- r
  - type: uint32
  - rule: optional
- w
  - type: uint32
  - rule: optional
- pr
  - type: uint32
  - rule: optional
- pw
  - type: uint32
  - rule: optional
- dw
  - type: uint32
  - rule: optional
- timeout
  - type: uint32
  - rule: optional
- sloppy_quorum
  - type: bool
  - rule: optional
- n_val
  - type: uint32
  - rule: optional
- type
  - type: bytes
  - rule: optional

## RpbListBucketsReq

- timeout
  - type: uint32
  - rule: optional
- stream
  - type: bool
  - rule: optional
- type
  - type: bytes
  - rule: optional

## RpbListBucketsResp

- buckets
  - type: bytes
  - rule: repeated
- done
  - type: bool
  - rule: optional

## RpbListKeysReq

- bucket
  - type: bytes
  - rule: required
- timeout
  - type: uint32
  - rule: optional
- type
  - type: bytes
  - rule: optional

## RpbListKeysResp

- keys
  - type: bytes
  - rule: repeated
- done
  - type: bool
  - rule: optional

## RpbMapRedReq

- request
  - type: bytes
  - rule: required
- content_type
  - type: bytes
  - rule: required

## RpbMapRedResp

- phase
  - type: uint32
  - rule: optional
- response
  - type: bytes
  - rule: optional
- done
  - type: bool
  - rule: optional

## RpbIndexReq

- bucket
  - type: bytes
  - rule: required
- index
  - type: bytes
  - rule: required
- qtype
  - type: [IndexQueryType](#indexquerytype)
  - rule: required
- key
  - type: bytes
  - rule: optional
- range_min
  - type: bytes
  - rule: optional
- range_max
  - type: bytes
  - rule: optional
- return_terms
  - type: bool
  - rule: optional
- stream
  - type: bool
  - rule: optional
- max_results
  - type: uint32
  - rule: optional
- continuation
  - type: bytes
  - rule: optional
- timeout
  - type: uint32
  - rule: optional
- type
  - type: bytes
  - rule: optional
- term_regex
  - type: bytes
  - rule: optional
- pagination_sort
  - type: bool
  - rule: optional

## RpbIndexResp

- keys
  - type: bytes
  - rule: repeated
- results
  - type: [RpbPair](#rpbpair)
  - rule: repeated
- continuation
  - type: bytes
  - rule: optional
- done
  - type: bool
  - rule: optional

## RpbCSBucketReq

- bucket
  - type: bytes
  - rule: required
- start_key
  - type: bytes
  - rule: required
- end_key
  - type: bytes
  - rule: optional
- start_incl
  - type: bool
  - rule: optional
- end_incl
  - type: bool
  - rule: optional
- continuation
  - type: bytes
  - rule: optional
- max_results
  - type: uint32
  - rule: optional
- timeout
  - type: uint32
  - rule: optional
- type
  - type: bytes
  - rule: optional

## RpbCSBucketResp

- objects
  - type: [RpbIndexObject](#rpbindexobject)
  - rule: repeated
- continuation
  - type: bytes
  - rule: optional
- done
  - type: bool
  - rule: optional

## RpbIndexObject

- key
  - type: bytes
  - rule: required
- object
  - type: [RpbGetResp](#rpbgetresp)
  - rule: required

## RpbContent

- value
  - type: bytes
  - rule: required
- content_type
  - type: bytes
  - rule: optional
- charset
  - type: bytes
  - rule: optional
- content_encoding
  - type: bytes
  - rule: optional
- vtag
  - type: bytes
  - rule: optional
- links
  - type: [RpbLink](#rpblink)
  - rule: repeated
- last_mod
  - type: uint32
  - rule: optional
- last_mod_usecs
  - type: uint32
  - rule: optional
- usermeta
  - type: [RpbPair](#rpbpair)
  - rule: repeated
- indexes
  - type: [RpbPair](#rpbpair)
  - rule: repeated
- deleted
  - type: bool
  - rule: optional

## RpbLink

- bucket
  - type: bytes
  - rule: optional
- key
  - type: bytes
  - rule: optional
- tag
  - type: bytes
  - rule: optional

## RpbCounterUpdateReq

- bucket
  - type: bytes
  - rule: required
- key
  - type: bytes
  - rule: required
- amount
  - type: sint64
  - rule: required
- w
  - type: uint32
  - rule: optional
- dw
  - type: uint32
  - rule: optional
- pw
  - type: uint32
  - rule: optional
- returnvalue
  - type: bool
  - rule: optional

## RpbCounterUpdateResp

- value
  - type: sint64
  - rule: optional

## RpbCounterGetReq

- bucket
  - type: bytes
  - rule: required
- key
  - type: bytes
  - rule: required
- r
  - type: uint32
  - rule: optional
- pr
  - type: uint32
  - rule: optional
- basic_quorum
  - type: bool
  - rule: optional
- notfound_ok
  - type: bool
  - rule: optional

## RpbCounterGetResp

- value
  - type: sint64
  - rule: optional

## RpbSearchDoc

- fields
  - type: [RpbPair](#rpbpair)
  - rule: repeated

## RpbSearchQueryReq

- q
  - type: bytes
  - rule: required
- index
  - type: bytes
  - rule: required
- rows
  - type: uint32
  - rule: optional
- start
  - type: uint32
  - rule: optional
- sort
  - type: bytes
  - rule: optional
- filter
  - type: bytes
  - rule: optional
- df
  - type: bytes
  - rule: optional
- op
  - type: bytes
  - rule: optional
- fl
  - type: bytes
  - rule: repeated
- presort
  - type: bytes
  - rule: optional

## RpbSearchQueryResp

- docs
  - type: [RpbSearchDoc](#rpbsearchdoc)
  - rule: repeated
- max_score
  - type: float
  - rule: optional
- num_found
  - type: uint32
  - rule: optional

## RpbYokozunaIndex

- name
  - type: bytes
  - rule: required
- schema
  - type: bytes
  - rule: optional
- n_val
  - type: uint32
  - rule: optional

## RpbYokozunaIndexGetReq

- name
  - type: bytes
  - rule: optional

## RpbYokozunaIndexGetResp

- index
  - type: [RpbYokozunaIndex](#rpbyokozunaindex)
  - rule: repeated

## RpbYokozunaIndexPutReq

- index
  - type: [RpbYokozunaIndex](#rpbyokozunaindex)
  - rule: required

## RpbYokozunaIndexDeleteReq

- name
  - type: bytes
  - rule: required

## RpbYokozunaSchema

- name
  - type: bytes
  - rule: required
- content
  - type: bytes
  - rule: optional

## RpbYokozunaSchemaPutReq

- schema
  - type: [RpbYokozunaSchema](#rpbyokozunaschema)
  - rule: required

## RpbYokozunaSchemaGetReq

- name
  - type: bytes
  - rule: required

## RpbYokozunaSchemaGetResp

- schema
  - type: [RpbYokozunaSchema](#rpbyokozunaschema)
  - rule: required

