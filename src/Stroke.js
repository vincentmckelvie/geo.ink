import {
    Vector3,
    AnimationMixer,
    Object3D,
    CatmullRomCurve3,
    TubeGeometry,
    VectorKeyframeTrack,
    QuaternionKeyframeTrack,
    AnimationClip,
    Quaternion,
    Color,
    Mesh,
    MeshBasicMaterial,
    BoxGeometry
} from './build/three.module.js';
class Stroke {
    constructor(OBJ){
        const self = this;
        this.pos = OBJ.pos;
        this.arr = [];//OBJ.pos;
        const aHolder = []
        this.avgPos = new Vector3();
        
        const len = OBJ.pos.length;
        for(let i = 0; i<len; i++){
            this.avgPos.add( OBJ.pos[i] );
            aHolder.push( new Vector3().copy( OBJ.pos[i] ) )
        }
        
        this.avgPos.divide(new Vector3(len,len,len));//.multiply(OBJ.all.scene.scale);
        
        for(let k = 0; k<len; k++){
            this.arr.push( new Vector3().subVectors (aHolder[k], this.avgPos) );
        }
        
        this.scn = new Object3D();
        this.scn.position.copy(this.avgPos);
        this.scn.position.add(OBJ.all.transformOffset.pos);
        this.scn.rotation.copy(OBJ.all.transformOffset.rot);
        this.scn.scale.copy(OBJ.all.transformOffset.scl);
        OBJ.all.scene.add(this.scn);
        
        this.rots = OBJ.rots;
        this.scales = OBJ.scl;
        this.all = OBJ.all;
        this.scene = OBJ.all.scene;
        this.param = OBJ.all.param;
        // for (const property in OBJ.all.param) {
        //     this.param[property] = OBJ.all.param[property];
        // }
        //OBJ.all.param;
        this.strokeIndex = this.all.index;
        this.modelInfo = this.all.modelInfo;

        this.total = Math.ceil( this.arr.length * this.all.globalDensityAmount);
        this.speed = 200;
        this.meshes = [];

        this.curve = new CatmullRomCurve3(this.arr);
        this.curve.curveType = 'centripetal';
        this.curve.closed = false;
        this.curve.tension = .5;
        
        this.sclMult = OBJ.all.sclMult;
        this.rotOffsetX = OBJ.all.rotOffsetX;
        this.rotOffsetY = OBJ.all.rotOffsetY;
        this.rotOffsetZ = OBJ.all.rotOffsetZ;

        this.tubeGeometry = new TubeGeometry( this.curve, 10, .01, 10, false );
     
        for(var i = 0; i<this.total; i++){
            const start = (i / this.total);
            const endInc = (i == this.total-1) ? i : (i + 1); 
            const end = (endInc / this.total);

            const rotFnl = {from:this.rots[Math.floor(start*this.rots.length)], to:this.rots[Math.floor(end*this.rots.length)]};
            const sclFnl = {from:this.scales[Math.floor(start*this.scales.length)], to:this.scales[Math.floor(end*this.scales.length)]};
            
            const pmesh = new PaintMesh({
                parent:this, 
                geo:this.tubeGeometry, 
                start:start, 
                scene:this.scn, 
                scale:this.all.meshScale, 
                total:this.total, 
                index:i, 
                rotation:rotFnl,
                scaleToFrom:sclFnl,
                meshClone:this.all.meshClone,
                strokeIndex:this.strokeIndex,
                helper:this.all.helper,
                globalShouldAnimateSize:this.all.globalShouldAnimateSize,
                sclMult:this.sclMult,
                rotOffsetX:this.rotOffsetX,
                rotOffsetY:this.rotOffsetY,
                rotOffsetZ:this.rotOffsetZ,
            });
            pmesh.initAnimation();
            this.meshes.push(pmesh);
        }
       
        self.updateParam(OBJ.all.param)
    
    }

    hover(){
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].hover();
        }
    }

    unHover(){
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].unHover();
        }  
    }

    updateModel (OBJ) {
        this.all.modelInfo.modelIndex = OBJ.modelInfo.modelIndex;
        this.all.modelInfo.urlIndex = OBJ.modelInfo.urlIndex;
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].updateModel(OBJ);

        }
    }

    updatePaintIndex(){
        this.strokeIndex--;
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].updatePaintIndex(this.strokeIndex);
        }
    }

    updateScale (OBJ) {
        this.sclMult = OBJ.scale;
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].updateScale({scale:this.sclMult});
        }
    }

    updateRotX(val){
        this.rotOffsetX = val;
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].updateRotX(val);
        }
    }
    
    updateRotY(val){
        this.rotOffsetY = val;
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].updateRotY(val);
        }
    }

    updateRotZ(val){
        this.rotOffsetZ = val;
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].updateRotZ(val);
        }
    }

    updateParam(param){
        // this.param = {};
        // for (const property in param) {
        //     this.param[property] = param[property]
        // }

        this.param = param;
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].updateMat(param);
        }  
    }

    update = function(OBJ){
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].update(OBJ);
        }  
    }

    killStroke(){
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].kill();
        }
        this.scene.remove(this.scn);
    }
    getExportData(){
        return {
            pos:this.pos,
            rots:this.rots,
            scales:this.scales,
            all:{
                param:{
                    twistAmt:this.param.twistAmt,
                    noiseSize:this.param.noiseSize,
                    twistSize:this.param.twistSize,
                    noiseAmt:this.param.noiseAmt,
                    rainbowAmt:this.param.rainbowAmt,
                    gradientSize:this.param.gradientSize,
                    gradientAngle:this.param.gradientAngle,
                    rainbowGradientSize:this.param.rainbowGradientSize,
                    gradientOffset:this.param.gradientOffset,
                    topColor:this.param.topColor.getHexString(),
                    bottomColor:this.param.bottomColor.getHexString(),
                    deformSpeed:this.param.deformSpeed,
                    colorSpeed:this.param.colorSpeed,
                    shouldLoopGradient:this.param.shouldLoopGradient,  
                },
                transformOffset:{pos: new Vector3().subVectors(this.scn.position, this.avgPos), rot:this.scn.rotation, scl:this.scn.scale},
                sclMult:this.sclMult,
                rotOffsetX:this.rotOffsetX,
                rotOffsetY:this.rotOffsetY,
                rotOffsetZ:this.rotOffsetZ,
                modelInfo:this.all.modelInfo,
                index:this.all.index,
                scene:this.scene.name,
                globalDensityAmount:this.all.globalDensityAmount, 
                meshScale:this.all.meshScale,
                globalShouldAnimateSize:this.all.globalShouldAnimateSize
            }
        }
    }
}


//PARENT, GEO, START, SCALE, TOTAL, I, ROTATION
class PaintMesh {
    constructor(OBJ) {
        //this.mesh = new THREE.Mesh(geometry.clone(), material.clone());
        //console.log(ROTATION)\
        const self = this;
        
        this.strokeIndex = OBJ.strokeIndex;
        this.parent = OBJ.parent;
        this.rots = OBJ.rotation;
        this.scaleToFrom = {to:OBJ.scaleToFrom.to, from:OBJ.scaleToFrom.from};
        this.scaleToFromOG = {to:OBJ.scaleToFrom.to, from:OBJ.scaleToFrom.from};

        this.mesh = OBJ.meshClone.clone();
        
        this.scene = OBJ.scene;
        
        this.total = OBJ.total;
        this.i = OBJ.index;
        this.meshScale = OBJ.scale;
        
        this.mesh.name = ""+this.mesh.uuid.slice(0, 12);//"scn_"+this.scene.name+"_s_"+this.strokeIndex+"_m_"+this.i;
        
        this.globalShouldAnimateSize = OBJ.globalShouldAnimateSize;
        this.mesh.scale.set(this.meshScale, this.meshScale, this.meshScale);
        //this.mesh.rotation.copy(helper.holder.rotation);
        
        this.scene.add(this.mesh);

        this.geo = OBJ.geo;
        this.start = OBJ.start;
        this.position = new Vector3();
        this.binormal = new Vector3();
        this.normal = new Vector3();
        this.lookAt = new Vector3();
        this.direction = new Vector3();
        this.inc = 0
        this.speed = .0031;
        this.keyframelength = 30*3;
        this.mixer = new AnimationMixer(this.mesh); 
        this.clip;
        this.positionkf;
        this.scalef;
        this.rotationkf;
        this.lookObj = new Object3D();
        this.ogEmissives = [];
        
        this.sclMult = OBJ.sclMult;
        this.rotOffsetX = OBJ.rotOffsetX;
        this.rotOffsetY = OBJ.rotOffsetY;
        this.rotOffsetZ = OBJ.rotOffsetZ;
        
        this.mesh.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.scale.set(self.sclMult, self.sclMult, self.sclMult);
                child.rotation.x = self.rotOffsetX;
                child.rotation.y = self.rotOffsetY;
                child.rotation.z = self.rotOffsetZ;
                child.paintIndex = self.strokeIndex;
                self.ogEmissives.push(child.material.emissive);
            }
        });
        
        //scene.add(this.lookObj);

     //for t in range(speed):
            //bpy.context.scene.frame_set(t)
            //fnl = (start + ( t * (( 1/total )/speed) ) )%1.0
            //constraint.offset_factor = fnl
            //constraint.keyframe_insert(data_path="offset_factor")
    }

    updatePaintIndex(val){
        this.strokeIndex = val;
        this.mesh.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.paintIndex = val;
            }
        });
    }

    hover(){
        this.mesh.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material.emissive = new Color(0xff0000);
            }
        });
    }
    unHover(){
        let i = 0;
        const self = this;
        this.mesh.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material.emissive = self.ogEmissives[i];
                i++;
            }
        });
    }

    updateModel(OBJ){

        const self = this;
        
        this.kill();

        this.mesh = OBJ.mesh.clone();
       
        this.mesh.name = ""+this.mesh.uuid.slice(0, 12);
        
        this.scene.add(this.mesh);
        this.ogEmissives = [];
        this.mesh.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.scale.set(self.sclMult, self.sclMult, self.sclMult);
                child.rotation.x = self.rotOffsetX;
                child.rotation.y = self.rotOffsetY;
                child.rotation.z = self.rotOffsetZ;
                child.paintIndex = self.strokeIndex;
                self.ogEmissives.push(child.material.emissive);
            }
        });

        this.mixer = new AnimationMixer(this.mesh); 
        this.initAnimation();
    }

    updateScale(OBJ){
        const self = this;
        this.sclMult = OBJ.scale;
        this.mesh.traverse(function(child){
            if(child.isMesh){
                child.scale.set(self.sclMult, self.sclMult, self.sclMult);
            }
        })   
    }

    updateRotX(val){
        const self = this;
        this.rotOffsetX = val;
        this.mesh.traverse(function(child){
            if(child.isMesh){
                child.rotation.x = self.rotOffsetX;
            }
        })   
    }

    updateRotY(val){
        const self = this;
        this.rotOffsetY = val;
        this.mesh.traverse(function(child){
            if(child.isMesh){
                child.rotation.y = self.rotOffsetY;
            }
        })   
    }
    
    updateRotZ(val){
        const self = this;
        this.rotOffsetZ = val;
        this.mesh.traverse(function(child){
            if(child.isMesh){
                child.rotation.z = self.rotOffsetZ;
            }
        })   
    }
    
    kill(){
        const self = this;
        
        // this.mesh.traverse( function ( obj ) {
        //     self.handleKill(obj);
        // });
        // this.handleKill(this.mesh);

        this.scene.remove(this.mesh);
    }

    handleKill(obj){
        if(obj.isMesh || obj.isSkinnedMesh){
            if(obj.material !=null ){
                for (const [key, value] of Object.entries(obj.material)) {
                    if( key.includes("Map") || key.includes("map") ){
                        if(value != null && value.isTexture){
                            value.dispose();
                        }
                    }
                }
                obj.material.dispose();
            }
            obj.geometry.dispose();
            //obj.dispose();
        }
    }

    updateMat(param){

        this.mesh.traverse( function ( child ) {
            if ( child.isMesh ) {
                if(child.material.userData.shader!=null){
                    child.material.userData.shader.uniforms.twistAmt.value = param.twistAmt;
                    child.material.userData.shader.uniforms.noiseSize.value = param.noiseSize;
                    child.material.userData.shader.uniforms.twistSize.value = param.twistSize;
                    child.material.userData.shader.uniforms.noiseAmt.value = param.noiseAmt;
                    child.material.userData.shader.uniforms.rainbowAmt.value = param.rainbowAmt;
                    child.material.userData.shader.uniforms.gradientSize.value = param.gradientSize;
                    child.material.userData.shader.uniforms.gradientAngle.value = param.gradientAngle;
                    child.material.userData.shader.uniforms.rainbowGradientSize.value = param.rainbowGradientSize;
                    child.material.userData.shader.uniforms.gradientOffset.value = param.gradientOffset;
                    child.material.userData.shader.uniforms.topColor.value = param.topColor;
                    child.material.userData.shader.uniforms.bottomColor.value = param.bottomColor;
                    child.material.userData.shader.uniforms.deformSpeed.value = param.deformSpeed;
                    child.material.userData.shader.uniforms.colorSpeed.value = param.colorSpeed;
                    child.material.userData.shader.uniforms.shouldLoopGradient.value = param.shouldLoopGradient;
                }
    
            }
        });
        
    }

    initAnimation (){
        
        const keys = [];
        const valuesP = [];
        const valuesR = [];
        const valuesS = [];
        
        for(let t = 0; t<this.keyframelength; t++){
        
            keys.push(t/30);
          
            const frameFraction = t * (( 1 / this.total ) / this.keyframelength) ;
          
            const key =  (this.start + ( frameFraction ));
            const trans = this.getTransforms( key );//.pos;

            let rots = new Quaternion();
            rots.slerpQuaternions ( this.rots.from, this.rots.to, t / this.keyframelength );
            
            const sFrm = this.scaleToFrom.from;
            const sTo = this.scaleToFrom.to;
            
            let scl = new Vector3();
            scl.lerpVectors(new Vector3(sFrm,sFrm,sFrm), new Vector3(sTo,sTo,sTo), t / this.keyframelength);

            valuesP.push(trans.pos.x);
            valuesP.push(trans.pos.y);
            valuesP.push(trans.pos.z);
            valuesR.push(rots.x);
            valuesR.push(rots.y);
            valuesR.push(rots.z);
            valuesR.push(rots.w);
            
            let s = 1;//this.meshScale;

            if(this.globalShouldAnimateSize){
                if(this.i == 0){
                    s = this.easeInOutSin(t / this.keyframelength);// * this.meshScale;
                } 
                if(this.i == this.total-1){
                    s = this.easeInOutSin(1.0 - (t / this.keyframelength));// * this.meshScale;
                }
            }

            valuesS.push(scl.x*s);
            valuesS.push(scl.y*s);
            valuesS.push(scl.z*s);
        }   
      
        this.positionkf = new VectorKeyframeTrack( '' +this.mesh.name+ '.position', keys, valuesP );
        this.rotationkf = new QuaternionKeyframeTrack('' +this.mesh.name+ '.quaternion', keys, valuesR );
        this.scalef = new VectorKeyframeTrack('' +this.mesh.name+ '.scale', keys, valuesS );
        // this.mixer = new THREE.AnimationMixer(this.mesh); 
        this.clip = new AnimationClip( 'Action_'+this.mesh.name, -1  , [ this.positionkf, this.rotationkf, this.scalef  ] );
        const clipAction = this.mixer.clipAction( this.clip );
        clipAction.play();
        this.mesh.animations.push(this.clip);
    
    }

    easeInOutSin(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    update = function(OBJ){

        if(this.mixer)
            this.mixer.update( OBJ.delta );
    }
    
    getTransforms (key) {
        
        //this.inc += this.speed;
        const time = key;//this.i+key
        
        const t = time%1;
        const pos = new Vector3();
        
        this.geo.parameters.path.getPointAt( t, pos );

        pos.multiplyScalar( 1 );

        const segments = this.geo.tangents.length;
        const pickt = t * segments;
        const pick = Math.floor( pickt );
        const pickNext = ( pick + 1 ) % segments;
        const binormal = new Vector3();
        //this.binormal.subVectors( this.geo.binormals[ pickNext ], this.geo.binormals[ pick ] );
        //this.binormal.multiplyScalar( pickt - pick ).add( this.geo.binormals[ pick ] );
        binormal.subVectors( this.geo.binormals[ pickNext ], this.geo.binormals[ pick ] );
        binormal.multiplyScalar( pickt - pick ).add( this.geo.binormals[ pick ] );
        const direction = new Vector3();

        this.geo.parameters.path.getTangentAt( t, direction );
        const offset = 15;
        const normal = new Vector3();
        normal.copy( binormal ).cross( direction );

        pos.add( this.normal.clone().multiplyScalar( 0 ) );
        this.lookObj.position.copy( pos );
        this.lookAt.copy( pos ).add( direction );
        this.lookObj.matrix.lookAt( this.lookObj.position, this.lookAt, normal );
        this.lookObj.quaternion.setFromRotationMatrix( this.lookObj.matrix );
        return {pos:pos, rot:this.lookObj.rotation};
        
    }
}


export { Stroke };